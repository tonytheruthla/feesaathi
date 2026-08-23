import { NextResponse } from "next/server";
import { classSlots } from "@/lib/db";
import { getCurrentTutor } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const tutor = await getCurrentTutor();
  if (!tutor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const slot = await classSlots.byId(params.id);
  if (!slot || slot.tutorId !== tutor.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await classSlots.remove(params.id);
  return NextResponse.json({ ok: true });
}
