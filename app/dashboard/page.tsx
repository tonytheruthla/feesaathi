"use client";

import { useCallback, useEffect, useState } from "react";
import Nav from "@/components/Nav";

type Due = {
  id: string;
  month: string;
  amount: number;
  status: string;
  paidAt: string | null;
  paymentMethod: string;
  razorpayLinkUrl: string;
  student: { id: string; name: string; parentName: string; parentPhone: string };
  reminders: { sentAt: string; channel: string }[];
};

function thisMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function Dashboard() {
  const [month, setMonth] = useState(thisMonth());
  const [dues, setDues] = useState<Due[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [collected, setCollected] = useState(0);
  const [pending, setPending] = useState(0);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/dues?month=${month}`);
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    const j = await res.json();
    setDues(j.dues);
    setCollected(j.collected);
    setPending(j.pending);
    setLoaded(true);
  }, [month]);

  useEffect(() => {
    setLoaded(false);
    load();
  }, [load]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  async function generate() {
    setBusy(true);
    const res = await fetch("/api/dues/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month }),
    });
    const j = await res.json();
    setBusy(false);
    flash(
      j.created > 0
        ? `Created ${j.created} due(s) for this month`
        : "All active students already have dues this month"
    );
    load();
  }

  async function remind(due: Due) {
    const res = await fetch(`/api/dues/${due.id}/remind`, { method: "POST" });
    const j = await res.json();
    if (!res.ok) {
      flash(j.error || "Reminder failed");
      return;
    }
    if (j.channel === "SHARE_LINK" && j.shareUrl) {
      window.open(j.shareUrl, "_blank");
      flash("Opening WhatsApp…");
    } else {
      flash(`Reminder sent to ${due.student.parentName || due.student.name} ✓`);
    }
    load();
  }

  async function remindAll() {
    const res = await fetch("/api/dues/remind-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month }),
    });
    const j = await res.json();
    if (!res.ok) {
      flash(j.error || "Failed");
      return;
    }
    if (j.mode === "sent") {
      flash(`Sent ${j.sent} reminder(s) automatically ✓`);
    } else if (j.queue?.length) {
      let i = 0;
      const openNext = () => {
        if (i >= j.queue.length) {
          flash("All reminders opened ✓");
          load();
          return;
        }
        const item = j.queue[i++];
        window.open(item.shareUrl, "_blank");
        if (i < j.queue.length) setTimeout(openNext, 1200);
        else {
          flash("All reminders opened ✓");
          load();
        }
      };
      openNext();
    } else {
      flash("Nothing pending to remind");
    }
    load();
  }

  async function togglePaid(due: Due) {
    await fetch(`/api/dues/${due.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: due.status === "PAID" ? "PENDING" : "PAID",
      }),
    });
    load();
  }

  const pendingDues = dues.filter((d) => d.status === "PENDING");
  const paidDues = dues.filter((d) => d.status === "PAID");
  const total = collected + pending;
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-7">
        {/* Hero balance card */}
        <div className="hero-card anim-fade-up">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-200/90">
              Pending this month
            </p>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white outline-none [color-scheme:dark]"
            />
          </div>
          <p className="font-display tnum mt-2 text-[44px] font-bold leading-none tracking-tight">
            ₹{pending.toLocaleString("en-IN")}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-emerald-300 transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-emerald-100/85">
            <span className="tnum">
              ₹{collected.toLocaleString("en-IN")} collected · {pct}%
            </span>
            <span>
              {pendingDues.length} student{pendingDues.length === 1 ? "" : "s"} left
            </span>
          </div>
          <div className="mt-5 flex gap-2.5">
            {pendingDues.length > 0 ? (
              <button onClick={remindAll} className="btn-onhero flex-1">
                Remind all on WhatsApp
              </button>
            ) : (
              <button onClick={generate} disabled={busy} className="btn-onhero flex-1">
                {busy ? "Working…" : "Generate this month's dues"}
              </button>
            )}
            {pendingDues.length > 0 && (
              <button
                onClick={generate}
                disabled={busy}
                className="btn border border-white/30 bg-white/10 px-4 text-white"
              >
                {busy ? "…" : "+ Dues"}
              </button>
            )}
          </div>
        </div>

        {/* Pending list */}
        <div className="anim-fade-up mt-8 flex items-center justify-between" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Pending ({pendingDues.length})
          </h2>
          {pendingDues.length > 1 && (
            <button onClick={remindAll} className="btn-ghost px-3 py-1.5 text-xs">
              Remind all pending
            </button>
          )}
        </div>
        <div className="stagger mt-3 space-y-2.5">
          {!loaded && (
            <>
              <div className="skeleton h-[74px]" />
              <div className="skeleton h-[74px]" />
            </>
          )}
          {loaded && pendingDues.length === 0 && (
            <div className="card anim-scale-in border-dashed p-6 text-center text-sm text-slate-400">
              {dues.length === 0
                ? "No dues yet — tap “Generate this month's dues” to start."
                : "All fees collected for this month 🎉"}
            </div>
          )}
          {loaded &&
            pendingDues.map((d) => (
              <div key={d.id} className="card card-hover flex items-center justify-between p-4">
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-50 text-sm font-bold text-amber-700">
                    {d.student.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold leading-tight">{d.student.name}</p>
                    <p className="tnum mt-0.5 text-sm text-slate-500">
                      ₹{d.amount.toLocaleString("en-IN")}
                      {d.reminders[0] && (
                        <span className="ml-2 text-xs text-slate-400">
                          · reminded {new Date(d.reminders[0].sentAt).toLocaleDateString("en-IN")}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button onClick={() => remind(d)} className="btn-primary whitespace-nowrap px-3.5 py-2 text-xs">
                    Remind
                  </button>
                  <button onClick={() => togglePaid(d)} className="btn-ghost whitespace-nowrap px-3 py-2 text-xs">
                    Paid ✓
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Paid list */}
        <h2 className="anim-fade-up mt-8 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Paid ({paidDues.length})
        </h2>
        <div className="stagger mt-3 space-y-2.5">
          {loaded &&
            paidDues.map((d) => (
              <div
                key={d.id}
                className="card flex items-center justify-between border-emerald-100/80 bg-emerald-50/40 p-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 text-sm font-bold text-emerald-700">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">{d.student.name}</p>
                    <p className="tnum mt-0.5 text-sm text-slate-500">
                      ₹{d.amount.toLocaleString("en-IN")} ·{" "}
                      {d.paidAt ? new Date(d.paidAt).toLocaleDateString("en-IN") : ""}
                      {d.paymentMethod &&
                        ` · ${d.paymentMethod === "RAZORPAY" ? "online" : d.paymentMethod.toLowerCase().replace("_", " ")}`}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <a href={`/receipt/${d.id}`} target="_blank" className="btn-ghost whitespace-nowrap px-3 py-2 text-xs">
                    Receipt
                  </a>
                  <button
                    onClick={() => togglePaid(d)}
                    className="rounded-full px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:text-slate-600"
                  >
                    Undo
                  </button>
                </div>
              </div>
            ))}
        </div>

        {toast && (
          <div className="anim-toast fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full bg-slate-900/95 px-5 py-2.5 text-sm font-medium text-white shadow-xl backdrop-blur">
            {toast}
          </div>
        )}
      </main>
    </>
  );
}
