"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";

export default function SettingsPage() {
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    phone: "",
    upiId: "",
    msgLanguage: "hinglish",
  });
  const [integrations, setIntegrations] = useState({
    whatsappApi: false,
    razorpay: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(async (res) => {
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const j = await res.json();
      setForm({
        name: j.tutor.name,
        businessName: j.tutor.businessName,
        phone: j.tutor.phone,
        upiId: j.tutor.upiId,
        msgLanguage: j.tutor.msgLanguage,
      });
      setIntegrations(j.integrations);
    });
  }, []);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaved(true);
  }

  const Badge = ({ on }: { on: boolean }) => (
    <span
      className={`chip ${
        on
          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      <span
        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
          on ? "bg-emerald-500" : "bg-slate-300"
        }`}
      />
      {on ? "Connected" : "Using fallback"}
    </span>
  );

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-7">
        <h1 className="anim-fade-up font-display text-2xl font-semibold tracking-tight">
          Settings
        </h1>

        <form onSubmit={save} className="card anim-fade-up mt-5 space-y-4 p-5" style={{ animationDelay: "0.05s" }}>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-600">Your name</span>
            <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-600">
              Coaching / class name <span className="font-normal text-slate-400">(shown in messages)</span>
            </span>
            <input className="input" value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-600">
              Your UPI ID <span className="font-normal text-slate-400">(fees go directly here when Razorpay is off)</span>
            </span>
            <input className="input" placeholder="name@okhdfcbank" value={form.upiId} onChange={(e) => set("upiId", e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-600">Reminder message language</span>
            <select className="input" value={form.msgLanguage} onChange={(e) => set("msgLanguage", e.target.value)}>
              <option value="hinglish">Hinglish (recommended)</option>
              <option value="english">English</option>
            </select>
          </label>
          <div className="flex items-center gap-3">
            <button className="btn-primary">Save</button>
            {saved && <span className="anim-fade-in text-sm font-medium text-emerald-600">Saved ✓</span>}
          </div>
        </form>

        <h2 className="anim-fade-up mt-8 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Integrations
        </h2>
        <div className="stagger mt-3 space-y-2.5">
          <div className="card card-hover p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">WhatsApp Business API</p>
              <Badge on={integrations.whatsappApi} />
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              When connected, reminders send automatically. Until then, tapping
              “Remind” opens the message in your own WhatsApp — one tap per parent.
              Setup: see SETUP notes in the README (Meta Business verification needed).
            </p>
          </div>
          <div className="card card-hover p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Razorpay payment links</p>
              <Badge on={integrations.razorpay} />
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              When connected, dues get an online payment link and mark themselves
              paid automatically. Until then, messages carry a UPI link to your
              UPI ID and you mark payments manually.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
