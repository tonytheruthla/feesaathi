import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { tutors } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const COOKIE = "feesaathi_session";

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function signSession(tutorId: string) {
  return jwt.sign({ tutorId }, JWT_SECRET, { expiresIn: "30d" });
}

export function setSessionCookie(token: string) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE);
}

export async function getCurrentTutor() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { tutorId: string };
    return (await tutors.byId(payload.tutorId)) || null;
  } catch {
    return null;
  }
}

export async function requireTutor() {
  const tutor = await getCurrentTutor();
  if (!tutor) throw new Error("UNAUTHORIZED");
  return tutor;
}
