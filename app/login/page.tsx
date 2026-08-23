"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (res.ok) router.push("/dashboard");
    else setError((await res.json()).error || "Login failed");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="anim-fade-up">
        <Link href="/" className="font-display text-2xl font-semibold text-emerald-800">
          Fee<span className="text-slate-900">Saathi</span>
        </Link>
        <h1 className="mt-6 text-xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Login to your account</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input className="input" type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="anim-fade-in text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="btn-primary w-full py-3">
            {busy ? "Logging in…" : "Login"}
          </button>
        </form>
        <p className="mt-5 text-sm text-slate-500">
          New here?{" "}
          <Link href="/register" className="font-semibold text-emerald-700 transition-colors hover:text-emerald-800">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
