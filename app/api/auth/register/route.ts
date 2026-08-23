import { NextResponse } from "next/server";
import { tutors } from "@/lib/db";
import { hashPassword, signSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const { name, email, password, businessName, upiId, phone } =
    await req.json();
  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email and password are required" },
      { status: 400 }
    );
  }
  if (await tutors.byEmail(email)) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }
  const tutor = await tutors.create({
    name,
    email,
    passwordHash: await hashPassword(password),
    businessName: businessName || "",
    upiId: upiId || "",
    phone: phone || "",
  });
  setSessionCookie(signSession(tutor.id));
  return NextResponse.json({ ok: true });
}
