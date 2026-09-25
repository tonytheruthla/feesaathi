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

const icons: Record<string, React.ReactNode> = {
  "/dashboard": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </svg>
  ),
  "/students": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.8-3 3-4.5 5.5-4.5S13.7 16 14.5 19" />
      <circle cx="16.5" cy="9.5" r="2.4" />
      <path d="M15.5 14.6c2.3.1 4.2 1.5 5 4.4" />
    </svg>
  ),
  "/classes": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="4.5" width="17" height="16" rx="3" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3M16 3v3" />
      <path d="M8 14h3M8 17h5" />
    </svg>
  ),
  "/announce": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10v4a1.5 1.5 0 0 0 1.5 1.5H8l7 4V4.5l-7 4H5.5A1.5 1.5 0 0 0 4 10Z" />
      <path d="M18.5 9.5a4 4 0 0 1 0 5" />
    </svg>
  ),
  "/settings": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.06-.4.1-.8.1-1.2Z" />
    </svg>
  ),
};

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <>
      <nav className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link
            href="/dashboard"
            className="font-display flex items-center gap-2 text-xl font-bold tracking-tight text-emerald-600 transition-opacity hover:opacity-80"
          >
            <svg viewBox="0 0 100 100" className="h-6 w-6" aria-hidden="true">
              <circle cx="38" cy="31" r="14" fill="#059669" />
              <path d="M12 88 C12 62 24 52 38 52 C52 52 64 62 64 88 Z" fill="#059669" />
              <circle cx="68" cy="41" r="11.5" fill="#0b1712" />
              <path d="M46 88 C46 68 56 60 68 60 C80 60 90 68 90 88 Z" fill="#0b1712" />
            </svg>
            <span>Fee<span className="text-slate-900">Saathi</span></span>
          </Link>
          <div className="hidden items-center gap-0.5 sm:flex">
            {tabs.map((t) => {
              const active = pathname.startsWith(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`relative whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-emerald-600/10 text-emerald-800 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)]"
                      : "text-slate-500 hover:bg-slate-900/5 hover:text-slate-800"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
          <button
            onClick={logout}
            className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-900/5 hover:text-slate-600"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* App-style bottom tab bar on phones */}
      <div className="bottom-nav">
        <div className="mx-auto flex max-w-md">
          {tabs.map((t) => {
            const active = pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`bottom-nav-item ${active ? "active" : ""}`}
              >
                {icons[t.href]}
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
