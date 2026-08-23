"use client";

import { useCallback, useEffect, useState } from "react";
import Nav from "@/components/Nav";

type Slot = {
  id: string;
  batch: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};
type Student = {
  id: string;
  name: string;
  parentName: string;
  parentPhone: string;
  batch: string;
  active: boolean;
};
type Mark = { studentId: string; status: "P" | "A" };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

function fmt(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function ClassesPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, "P" | "A">>({});
  const [tutorName, setTutorName] = useState("");
  const [msgLang, setMsgLang] = useState("hinglish");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ batch: "", dayOfWeek: "1", startTime: "17:00", endTime: "" });
  const [toast, setToast] = useState("");

  const today = new Date();
  const todayDow = today.getDay();
  const todayIso = today.toISOString().slice(0, 10);

  const load = useCallback(async () => {
    const [sRes, stRes, aRes, setRes] = await Promise.all([
      fetch("/api/schedule"),
      fetch("/api/students"),
      fetch(`/api/attendance?date=${todayIso}`),
      fetch("/api/settings"),
    ]);
    if (sRes.status === 401) {
      window.location.href = "/login";
      return;
    }
    setSlots((await sRes.json()).slots);
    setStudentsList((await stRes.json()).students.filter((s: Student) => s.active));
    const m: Record<string, "P" | "A"> = {};
    for (const mk of (await aRes.json()).marks as Mark[]) m[mk.studentId] = mk.status;
    setMarks(m);
    const j = await setRes.json();
    setTutorName(j.tutor.businessName || j.tutor.name);
    setMsgLang(j.tutor.msgLanguage);
  }, [todayIso]);

  useEffect(() => {
    load();
  }, [load]);

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 3000);
  }

  async function addSlot(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    load();
  }

  async function removeSlot(id: string) {
    await fetch(`/api/schedule/${id}`, { method: "DELETE" });
    load();
  }

  function studentsOf(batch: string) {
    if (!batch || batch === "All students") return studentsList;
    return studentsList.filter((s) => s.batch === batch);
  }

  function classReminder(slot: Slot) {
    const kids = studentsOf(slot.batch);
    if (kids.length === 0) {
      flash("No students in this batch");
      return;
    }
    let i = 0;
    const openNext = () => {
      if (i >= kids.length) {
        flash("All class reminders opened ✓");
        return;
      }
      const s = kids[i++];
      const text =
        msgLang === "english"
          ? `Dear ${s.parentName || "Parent"}, a reminder that ${s.name}'s class (${slot.batch}) is today at ${fmt(slot.startTime)}. — ${tutorName}\n\n_Sent via FeeSaathi_`
          : `Namaste ${s.parentName || "ji"} 🙏 Aaj ${s.name} ki class (${slot.batch}) ${fmt(slot.startTime)} baje hai. — ${tutorName}\n\n_Sent via FeeSaathi_`;
      window.open(
        `https://wa.me/${s.parentPhone}?text=${encodeURIComponent(text)}`,
        "_blank"
      );
      if (i < kids.length) setTimeout(openNext, 1200);
      else flash("All class reminders opened ✓");
    };
    openNext();
  }

  async function mark(studentId: string, status: "P" | "A") {
    setMarks((m) => ({ ...m, [studentId]: status }));
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, date: todayIso, status }),
    });
  }

  const todaySlots = slots.filter((s) => s.dayOfWeek === todayDow);
  const batches = Array.from(
    new Set(studentsList.map((s) => s.batch).filter(Boolean))
  );
  const presentCount = Object.values(marks).filter((v) => v === "P").length;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-7">
        <div className="anim-fade-up flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Classes</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className={showForm ? "btn-ghost" : "btn-primary"}
          >
            {showForm ? "Close" : "+ Add class"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={addSlot} className="card anim-scale-in mt-4 space-y-3 p-5">
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">Batch</span>
                <input
                  className="input"
                  list="batches"
                  placeholder="All students"
                  value={form.batch}
                  onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))}
                />
                <datalist id="batches">
                  {batches.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">Day</span>
                <select
                  className="input"
                  value={form.dayOfWeek}
                  onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: e.target.value }))}
                >
                  {DAYS_FULL.map((d, i) => (
                    <option key={d} value={i}>{d}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">Starts</span>
                <input className="input" type="time" value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} required />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">Ends (optional)</span>
                <input className="input" type="time" value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
              </label>
            </div>
            <button className="btn-primary">Add to timetable</button>
          </form>
        )}

        {/* Today */}
        <h2 className="anim-fade-up mt-6 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Today · {DAYS_FULL[todayDow]}
        </h2>
        <div className="stagger mt-3 space-y-2.5">
          {todaySlots.length === 0 && (
            <div className="card border-dashed p-5 text-sm text-slate-400">
              No classes scheduled today.
            </div>
          )}
          {todaySlots.map((s) => (
            <div key={s.id} className="card card-hover flex items-center justify-between p-4">
              <div>
                <p className="font-semibold">{s.batch || "All students"}</p>
                <p className="tnum text-sm text-slate-500">
                  {fmt(s.startTime)}
                  {s.endTime && ` – ${fmt(s.endTime)}`} · {studentsOf(s.batch).length} students
                </p>
              </div>
              <button onClick={() => classReminder(s)} className="btn-primary px-3.5 py-2">
                Send class reminder
              </button>
            </div>
          ))}
        </div>

        {/* Attendance */}
        <div className="anim-fade-up mt-8 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Today&apos;s attendance
          </h2>
          <span className="chip bg-emerald-50 text-emerald-700 border border-emerald-200">
            {presentCount}/{studentsList.length} present
          </span>
        </div>
        <div className="stagger mt-3 space-y-2">
          {studentsList.map((s) => (
            <div key={s.id} className="card flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium leading-tight">{s.name}</p>
                {s.batch && <p className="text-xs text-slate-400">{s.batch}</p>}
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => mark(s.id, "P")}
                  className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                    marks[s.id] === "P"
                      ? "bg-emerald-600 text-white shadow"
                      : "border border-slate-200 text-slate-500 hover:border-emerald-300"
                  }`}
                >
                  P
                </button>
                <button
                  onClick={() => mark(s.id, "A")}
                  className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                    marks[s.id] === "A"
                      ? "bg-red-500 text-white shadow"
                      : "border border-slate-200 text-slate-500 hover:border-red-300"
                  }`}
                >
                  A
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly timetable */}
        <h2 className="anim-fade-up mt-8 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Weekly timetable
        </h2>
        <div className="card mt-3 divide-y divide-slate-100 p-2">
          {slots.length === 0 && (
            <p className="p-4 text-sm text-slate-400">
              No classes yet — add your weekly schedule above.
            </p>
          )}
          {slots.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-3 py-2.5">
              <p className="text-sm">
                <span className="chip mr-2 bg-slate-100 font-semibold text-slate-600">
                  {DAYS[s.dayOfWeek]}
                </span>
                <span className="font-medium">{s.batch || "All students"}</span>
                <span className="tnum ml-2 text-slate-500">
                  {fmt(s.startTime)}
                  {s.endTime && ` – ${fmt(s.endTime)}`}
                </span>
              </p>
              <button
                onClick={() => removeSlot(s.id)}
                className="rounded-full px-2 py-1 text-xs text-slate-400 hover:text-red-500"
              >
                Remove
              </button>
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
