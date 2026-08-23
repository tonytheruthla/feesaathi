"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";

type Student = {
  id: string;
  name: string;
  parentName: string;
  parentPhone: string;
  monthlyFee: number;
  dueDay: number;
  batch: string;
  active: number | boolean;
};

const empty = {
  name: "",
  parentName: "",
  parentPhone: "",
  monthlyFee: "",
  dueDay: "5",
  batch: "",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importFee, setImportFee] = useState("");
  const [toast, setToast] = useState("");

  const contactsSupported =
    typeof navigator !== "undefined" && "contacts" in navigator;

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 3500);
  }

  async function importFromContacts() {
    if (!importFee) {
      setError("Set the monthly fee first — applied to all imported students.");
      return;
    }
    try {
      // Contact Picker API — Chrome on Android
      const picked = await (
        navigator as unknown as {
          contacts: { select: (p: string[], o: { multiple: boolean }) => Promise<{ name: string[]; tel: string[] }[]> };
        }
      ).contacts.select(["name", "tel"], { multiple: true });
      let added = 0;
      for (const c of picked) {
        const phone = (c.tel?.[0] || "").replace(/[^\d]/g, "");
        if (!phone) continue;
        const res = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: c.name?.[0] || "Student",
            parentName: c.name?.[0] || "",
            parentPhone: phone,
            monthlyFee: Number(importFee),
          }),
        });
        if (res.ok) added++;
      }
      flash(`Imported ${added} student(s) from contacts ✓`);
      setShowImport(false);
      load();
    } catch {
      flash("Contact picking was cancelled");
    }
  }

  async function load() {
    const res = await fetch("/api/students");
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    setStudents((await res.json()).students);
    setLoaded(true);
  }

  useEffect(() => {
    load();
  }, []);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function startEdit(s: Student) {
    setEditing(s.id);
    setForm({
      name: s.name,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      monthlyFee: String(s.monthlyFee),
      dueDay: String(s.dueDay),
      batch: s.batch,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(
      editing ? `/api/students/${editing}` : "/api/students",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );
    if (!res.ok) {
      setError((await res.json()).error || "Failed");
      return;
    }
    setForm(empty);
    setEditing(null);
    setShowForm(false);
    load();
  }

  async function toggleActive(s: Student) {
    await fetch(`/api/students/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !s.active }),
    });
    load();
  }

  const activeCount = students.filter((s) => s.active).length;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-7">
        <div className="anim-fade-up flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Students <span className="text-slate-400">({activeCount})</span>
          </h1>
          <div className="flex gap-2">
            {contactsSupported && (
              <button
                onClick={() => setShowImport((v) => !v)}
                className="btn-ghost"
                title="Add students from your phone contacts"
              >
                📇 From contacts
              </button>
            )}
            <button
              onClick={() => {
                setShowForm((v) => !v);
                setEditing(null);
                setForm(empty);
              }}
              className={showForm ? "btn-ghost" : "btn-primary"}
            >
              {showForm ? "Close" : "+ Add student"}
            </button>
          </div>
        </div>

        {showImport && (
          <div className="card anim-scale-in mt-4 space-y-3 p-5">
            <p className="text-sm text-slate-600">
              Pick parents straight from your phone contacts — name and WhatsApp
              number fill in automatically. Set the monthly fee they&apos;ll all
              start with (you can edit each later).
            </p>
            <div className="flex gap-2">
              <input
                className="input w-40"
                type="number"
                placeholder="Monthly fee ₹"
                value={importFee}
                onChange={(e) => setImportFee(e.target.value)}
              />
              <button onClick={importFromContacts} className="btn-primary">
                Pick contacts
              </button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}

        {showForm && (
          <form onSubmit={submit} className="card anim-scale-in mt-5 space-y-3 p-5">
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="Student name *" value={form.name}
                onChange={(e) => set("name", e.target.value)} required />
              <input className="input" placeholder="Parent name" value={form.parentName}
                onChange={(e) => set("parentName", e.target.value)} />
              <input className="input" placeholder="Parent WhatsApp number *" value={form.parentPhone}
                onChange={(e) => set("parentPhone", e.target.value)} required />
              <input className="input" type="number" placeholder="Monthly fee ₹ *" value={form.monthlyFee}
                onChange={(e) => set("monthlyFee", e.target.value)} required min={1} />
              <input className="input" type="number" placeholder="Due day (1-28)" value={form.dueDay}
                onChange={(e) => set("dueDay", e.target.value)} min={1} max={28} />
              <input className="input" placeholder="Batch (optional)" value={form.batch}
                onChange={(e) => set("batch", e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary">
              {editing ? "Save changes" : "Add student"}
            </button>
          </form>
        )}

        <div className="stagger mt-5 space-y-2.5">
          {!loaded && (
            <>
              <div className="skeleton h-[76px]" />
              <div className="skeleton h-[76px]" />
              <div className="skeleton h-[76px]" />
            </>
          )}
          {loaded && students.length === 0 && (
            <div className="card anim-scale-in border-dashed p-8 text-center text-sm text-slate-400">
              No students yet. Add your first student — it takes 20 seconds.
            </div>
          )}
          {loaded &&
            students.map((s) => (
              <div
                key={s.id}
                className={`card flex items-center justify-between p-4 transition-opacity ${
                  s.active ? "card-hover" : "opacity-50"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 text-sm font-bold text-emerald-700">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">
                      {s.name}
                      {s.batch && (
                        <span className="chip ml-2 bg-slate-100 text-slate-500">{s.batch}</span>
                      )}
                    </p>
                    <p className="tnum mt-0.5 text-sm text-slate-500">
                      ₹{s.monthlyFee.toLocaleString("en-IN")}/mo · due {s.dueDay}th
                      {s.parentName && ` · ${s.parentName}`} · +{s.parentPhone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(s)} className="btn-ghost px-3.5 py-2">
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(s)}
                    className="rounded-full px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:text-slate-600"
                  >
                    {s.active ? "Archive" : "Restore"}
                  </button>
                </div>
              </div>
            ))}
        </div>

        {toast && (
          <div className="anim-toast fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full bg-slate-900/95 px-5 py-2.5 text-sm font-medium text-white shadow-xl">
            {toast}
          </div>
        )}
      </main>
    </>
  );
}
