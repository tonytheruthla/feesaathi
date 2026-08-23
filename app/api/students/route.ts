import { NextResponse } from "next/server";
import { students } from "@/lib/db";
import { getCurrentTutor } from "@/lib/auth";

export async function GET() {
  const tutor = await getCurrentTutor();
  if (!tutor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ students: await students.list(tutor.id) });
}

export async function POST(req: Request) {
  const tutor = await getCurrentTutor();
  if (!tutor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.name || !b.parentPhone || !b.monthlyFee) {
    return NextResponse.json(
      { error: "Student name, parent phone and monthly fee are required" },
      { status: 400 }
    );
  }
  const phone = String(b.parentPhone).replace(/[^\d]/g, "");
  const student = await students.create({
    tutorId: tutor.id,
    name: b.name,
    parentName: b.parentName || "",
    parentPhone: phone.length === 10 ? `91${phone}` : phone,
    monthlyFee: Number(b.monthlyFee),
    dueDay: Number(b.dueDay) || 5,
    batch: b.batch || "",
    notes: b.notes || "",
  });
  return NextResponse.json({ student });
}
