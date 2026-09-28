import crypto from "crypto";
import { NextResponse } from "next/server";
import { q, tutors } from "@/lib/db";
import { hashPassword, signSession, setSessionCookie } from "@/lib/auth";
import { verifyGoogleIdToken } from "@/lib/google";

export const dynamic = "force-dynamic";

// GET: tells the login/register pages whether Google sign-in is switched on.
export function GET() {
  return NextResponse.json({ clientId: process.env.GOOGLE_CLIENT_ID || "" });
}

// POST { credential }: verify the Google ID token, then log in or create the tutor.
export async function POST(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google sign-in is not set up yet" }, { status: 503 });
  }
  const { credential } = await req.json().catch(() => ({}));

  let profile;
  try {
    profile = await verifyGoogleIdToken(credential, clientId);
  } catch {
    return NextResponse.json({ error: "Google sign-in failed. Please try again." }, { status: 401 });
  }

  const found = await q<{ id: string }>(
    `SELECT id FROM tutor WHERE lower(email) = $1 LIMIT 1`,
    [profile.email]
  );
  let tutorId = found[0]?.id;
  let created = false;

  if (!tutorId) {
    // Google users have no password. Store a random, unusable hash so the
    // NOT NULL column is satisfied and password login stays impossible.
    const tutor = await tutors.create({
      name: profile.name,
      email: profile.email,
      passwordHash: await hashPassword(crypto.randomBytes(32).toString("hex")),
      businessName: "",
      upiId: "",
    });
    if (!tutor) {
      return NextResponse.json({ error: "Could not create your account" }, { status: 500 });
    }
    tutorId = tutor.id;
    created = true;
  }

  setSessionCookie(signSession(tutorId));
  return NextResponse.json({ ok: true, created });
}
