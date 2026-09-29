import { NextResponse } from "next/server";
import { signSession, setSessionCookie } from "@/lib/auth";
import { tutorFromGoogleCredential } from "@/lib/googleAuth";

export const dynamic = "force-dynamic";

// GET: tells the login/register pages whether Google sign-in is switched on.
export function GET() {
  return NextResponse.json({ clientId: process.env.GOOGLE_CLIENT_ID || "" });
}

// POST { credential }: popup flow on the website. Verify the Google ID token,
// then log in or create the tutor.
export async function POST(req: Request) {
  const { credential } = await req.json().catch(() => ({}));
  const r = await tutorFromGoogleCredential(credential);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  setSessionCookie(signSession(r.tutorId));
  return NextResponse.json({ ok: true, created: r.created });
}
