"use client";

import { useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";

type Student = {
  id: string;
  name: string;
  parentName: string;
  parentPhone: string;
  batch: string;
  active: number | boolean;
};

type QueueItem = { studentId: string; name: string; shareUrl: string };

const QUICK = [
  "Kal class nahi hogi. (No class tomorrow.)",
  "Test on Friday — please revise this week's chapter.",
  "Class timing change: ",
  "Holiday notice: ",
];

export default function AnnouncePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [batch, setBatch] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/students");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      setStudents((await res.json()).students);
      setLoaded(true);
    })();
  }, []);

  const batches = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.active && s.batch) set.add(s.batch);
    });
    return Array.from(set).sort();
  }, [students]);

  const recipients = useMemo(() => {
    const phones = new Set<string>();
    students.forEach((s) => {
      if (s.active && (!batch || s.batch === batch)) phones.add(s.parentPhone);
    });
    return phones.size;
  }, [students, batch]);

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 4000);
  }

  async function send() {
    setError("");
    if (!message.trim()) {
      setError("Write the announcement first.");
      return;
    }
    setSending(true);
    const res = await fetch("/api/announce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, batch }),
    });
    if (!res.ok) {
      setError((await res.json()).error || "Failed");
      setSending(false);
      return;
    }
    const data = await res.json();
    const queue: QueueItem[] = data.queue || [];
    if (queue.length === 0) {
      flash("No parents to send to.");
      setSending(false);
      return;
    }
    setProgress({ done: 0, total: queue.length });
    queue.forEach((q, idx) => {
      setTimeout(() => {
        window.open(q.shareUrl, "_blank");
        setProgress({ done: idx + 1, total: queue.length });
        if (idx === queue.length - 1) {
          setSending(false);
          setProgress(null);
          flash("Announcement queued for " + queue.length + " parent(s) ✓");
          setMessage("");
        }
      }, idx * 1200);
    });
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-7">
        <div className="anim-fade-up">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Announce
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            One message, every parent&apos;s WhatsApp — holiday notices, test
            reminders, timing changes.
          </p>
        </div>

        <div className="card anim-scale-in mt-5 space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button
                key={q}
                onClick={() => setMessage(q)}
                className="btn-ghost px-3 py-1.5 text-xs"
              >
                {q.length > 34 ? q.slice(0, 34) + "…" : q}
              </button>
            ))}
          </div>
          <textarea
            className="input min-h-[120px] w-full"
            placeholder="Write your announcement… (sent exactly as typed, with your name signed below)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                className="input w-auto"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
              >
                <option value="">All batches</option>
                {batches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <span className="text-sm text-slate-500">
                {loaded ? recipients + " parent(s)" : "…"}
              </span>
            </div>
            <button
              onClick={send}
              disabled={sending || !loaded}
              className="btn-primary disabled:opacity-50"
            >
              {progress
                ? "Opening " + progress.done + "/" + progress.total + "…"
                : "Send on WhatsApp"}
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-xs text-slate-400">
            Opens one WhatsApp chat per parent with the message pre-filled — you
            just tap send in each. Allow pop-ups for this site.
          </p>
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
