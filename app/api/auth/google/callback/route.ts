import { NextResponse } from "next/server";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { tutorFromGoogleCredential } from "@/lib/googleAuth";

export const dynamic = "force-dynamic";

// Redirect flow (ux_mode "redirect"), used inside the installed Android app
// where popups are unreliable. Google POSTs a form with `credential` and
// `g_csrf_token` to this URL; it must be listed as an Authorized redirect URI
// on the OAuth client.
export async function POST(req: Request) {
  const base = process.env.APP_URL || new URL(req.url).origin;
  const fail = (reason: string) =>
    NextResponse.redirect(`${base}/login?google=${reason}`, { status: 303 });

  const form = await req.formData().catch(() => null);
  const credential = String(form?.get("credential") || "");
  const bodyCsrf = String(form?.get("g_csrf_token") || "");
  const cookieCsrf = /(?:^|;\s*)g_csrf_token=([^;]+)/.exec(req.headers.get("cookie") || "")?.[1];
  // Double-submit check whenever the browser sent Google's CSRF cookie.
  if (cookieCsrf && cookieCsrf !== bodyCsrf) return fail("csrf");
  if (!credential) return fail("missing");

  const r = await tutorFromGoogleCredential(credential);
  if ("error" in r) return fail(r.status === 503 ? "off" : "failed");

  const res = NextResponse.redirect(`${base}/dashboard`, { status: 303 });
  res.cookies.set(SESSION_COOKIE, signSession(r.tutorId), sessionCookieOptions);
  return res;
}
