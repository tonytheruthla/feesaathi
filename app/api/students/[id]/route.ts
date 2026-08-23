import { NextResponse } from "next/server";
import { students } from "@/lib/db";
import { getCurrentTutor } from "@/lib/auth";

async function owned(id: string, tutorId: string) {
  const s = await students.byId(id);
  return s && s.tutorId === tutorId ? s : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const tutor = await getCurrentTutor();
  if (!tutor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await owned(params.id, tutor.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const b = await req.json();
  const data: Record<string, unknown> = {};
  for (const k of ["name", "parentName", "batch", "notes"]) {
    if (b[k] !== undefined) data[k] = b[k];
  }
  if (b.parentPhone !== undefined) {
    const phone = String(b.parentPhone).replace(/[^\d]/g, "");
    data.parentPhone = phone.length === 10 ? `91${phone}` : phone;
  }
  if (b.monthlyFee !== undefined) data.monthlyFee = Number(b.monthlyFee);
  if (b.dueDay !== undefined) data.dueDay = Number(b.dueDay);
  if (b.active !== undefined) data.active = Boolean(b.active);
  const student = await students.update(params.id, data);
  return NextResponse.json({ student });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const tutor = await getCurrentTutor();
  if (!tutor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await owned(params.id, tutor.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await students.remove(params.id);
  return NextResponse.json({ ok: true });
}
