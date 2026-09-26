"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    email: "",
    password: "",
    upiId: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (res.ok) router.push("/dashboard");
    else setError((await res.json()).error || "Registration failed");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-10">
      <div className="anim-fade-up">
        <Link href="/" className="inline-block text-2xl">
          <Logo />
        </Link>
        <h1 className="mt-6 text-xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Two minutes now, hours saved every month
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input className="input" placeholder="Your name" value={form.name}
            onChange={(e) => set("name", e.target.value)} required />
          <input className="input" placeholder="Coaching / class name (optional)"
            value={form.businessName}
            onChange={(e) => set("businessName", e.target.value)} />
          <input className="input" type="email" placeholder="Email" value={form.email}
            onChange={(e) => set("email", e.target.value)} required />
          <input className="input" type="password" placeholder="Password (min 6 chars)"
            value={form.password} minLength={6}
            onChange={(e) => set("password", e.target.value)} required />
          <div>
            <input className="input" placeholder="Your UPI ID e.g. name@okhdfcbank"
              value={form.upiId} onChange={(e) => set("upiId", e.target.value)} />
            <p className="mt-1.5 text-xs text-slate-400">
              Fees go straight to this UPI ID — you can add it later in Settings.
            </p>
          </div>
          {error && <p className="anim-fade-in text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="btn-primary w-full py-3">
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="mt-5 text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-emerald-700 transition-colors hover:text-emerald-800">
            Login
          </Link>
        </p>
        <p className="mt-8 text-xs text-slate-400">
          Need help?{" "}
          <a href="mailto:rahul@feesaathi.com" className="text-slate-500 underline-offset-2 hover:underline">
            rahul@feesaathi.com
          </a>
        </p>
      </div>
    </main>
  );
}
