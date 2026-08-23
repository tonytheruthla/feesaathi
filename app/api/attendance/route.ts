import { NextResponse } from "next/server";
import { attendance, students } from "@/lib/db";
import { getCurrentTutor } from "@/lib/auth";

// GET /api/attendance?date=YYYY-MM-DD — marks for that date
export async function GET(req: Request) {
  const tutor = await getCurrentTutor();
  if (!tutor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);
  return NextResponse.json({ date, marks: await attendance.forDate(tutor.id, date) });
}

// POST /api/attendance { studentId, date, status: "P"|"A" }
export async function POST(req: Request) {
  const tutor = await getCurrentTutor();
  if (!tutor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  const student = await students.byId(b.studentId);
  if (!student || student.tutorId !== tutor.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (b.status !== "P" && b.status !== "A") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const date = b.date || new Date().toISOString().slice(0, 10);
  await attendance.mark(b.studentId, date, b.status);
  return NextResponse.json({ ok: true });
}
