"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Gsi = {
  accounts: {
    id: {
      initialize: (o: Record<string, unknown>) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
    };
  };
};
declare global {
  interface Window { google?: Gsi }
}

const SRC = "https://accounts.google.com/gsi/client";

function loadGsi(): Promise<Gsi> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google);
    let s = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
    if (!s) {
      s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", () => resolve(window.google as Gsi));
    s.addEventListener("error", () => reject(new Error("gsi")));
  });
}

// "Sign up with Google" / "Sign in with Google". Renders nothing until
// GOOGLE_CLIENT_ID is set on the server and Google's script loads, so the page
// never shows a dead button.
export function GoogleButton({ mode }: { mode: "signup" | "signin" }) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Errors coming back from the redirect flow (/api/auth/google/callback).
    const reason = new URLSearchParams(window.location.search).get("google");
    if (reason) setError(reason === "off" ? "Google sign-in is not set up yet" : "Google sign-in failed. Please try again.");
    let cancelled = false;
    (async () => {
      try {
        const { clientId } = await (await fetch("/api/auth/google")).json();
        if (!clientId || cancelled) return;
        const g = await loadGsi();
        if (cancelled || !box.current) return;
        setEnabled(true);
        // Inside the installed Android app (TWA / home-screen PWA) popups are
        // unreliable, so use Google's full-page redirect flow there.
        const installed =
          window.matchMedia("(display-mode: standalone)").matches ||
          document.referrer.startsWith("android-app://");
        g.accounts.id.initialize({
          client_id: clientId,
          ux_mode: installed ? "redirect" : "popup",
          login_uri: `${window.location.origin}/api/auth/google/callback`,
          callback: async ({ credential }: { credential: string }) => {
            setBusy(true);
            setError("");
            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential }),
            });
            if (res.ok) {
              router.push("/dashboard");
              router.refresh();
            } else {
              setBusy(false);
              setError((await res.json().catch(() => ({}))).error || "Google sign-in failed");
            }
          },
        });
        g.accounts.id.renderButton(box.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: mode === "signup" ? "signup_with" : "signin_with",
          logo_alignment: "center",
          width: 320,
        });
      } catch {
        if (!cancelled) setEnabled(false);
      }
    })();
    return () => { cancelled = true; };
  }, [mode, router]);

  return (
    <div className={enabled ? "mt-6" : "hidden"}>
      <div ref={box} className={`flex min-h-[44px] justify-center ${busy ? "pointer-events-none opacity-60" : ""}`} />
      {busy && <p className="mt-2 text-center text-xs text-slate-500">Signing you in…</p>}
      {error && <p className="anim-fade-in mt-2 text-center text-sm text-red-600">{error}</p>}
      <div className="mt-6 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or with email
        <span className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  );
}
