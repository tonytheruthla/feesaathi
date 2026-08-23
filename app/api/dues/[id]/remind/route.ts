import { NextResponse } from "next/server";
import { dues, students } from "@/lib/db";
import { getCurrentTutor } from "@/lib/auth";
import { remindDue } from "@/lib/remind";

// POST /api/dues/:id/remind
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const tutor = await getCurrentTutor();
  if (!tutor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const due = await dues.byId(params.id);
  const student = due ? await students.byId(due.studentId) : undefined;
  if (!due || !student || student.tutorId !== tutor.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (due.status === "PAID") {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  const result = await remindDue(due, student, tutor);
  if (!result.ok) {
    return NextResponse.json(
      { error: `WhatsApp send failed: ${result.error}` },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, channel: result.channel, shareUrl: result.shareUrl });
}
