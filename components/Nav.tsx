"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Dues" },
  { href: "/students", label: "Students" },
  { href: "/classes", label: "Classes" },
  { href: "/announce", label: "Announce" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <nav className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link
          href="/dashboard"
          className="font-display text-xl font-semibold tracking-tight text-emerald-800 transition-opacity hover:opacity-80"
        >
          Fee<span className="text-slate-900">Saathi</span>
        </Link>
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {tabs.map((t) => {
            const active = pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`relative whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-emerald-600/10 text-emerald-800 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)]"
                    : "text-slate-500 hover:bg-slate-900/5 hover:text-slate-800"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="ml-1 whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-900/5 hover:text-slate-600"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
