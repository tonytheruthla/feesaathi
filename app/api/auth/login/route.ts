import { NextResponse } from "next/server";
import { tutors } from "@/lib/db";
import { verifyPassword, signSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const tutor = await tutors.byEmail(email);
  if (!tutor || !(await verifyPassword(password, tutor.passwordHash))) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }
  setSessionCookie(signSession(tutor.id));
  return NextResponse.json({ ok: true });
}
