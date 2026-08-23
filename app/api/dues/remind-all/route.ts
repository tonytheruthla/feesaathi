import { NextResponse } from "next/server";
import { dues, students } from "@/lib/db";
import { getCurrentTutor } from "@/lib/auth";
import { remindDue } from "@/lib/remind";
import { whatsappConfigured } from "@/lib/whatsapp";

// POST /api/dues/remind-all { month }
// WA API configured → sends every pending reminder automatically.
// Otherwise → returns the queue of wa.me share links so the UI can
// walk the tutor through them one tap at a time.
export async function POST(req: Request) {
  const tutor = await getCurrentTutor();
  if (!tutor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const month = body.month || new Date().toISOString().slice(0, 7);

  const board = await dues.boardForMonth(tutor.id, month);
  const pending = board.filter((d) => d.status === "PENDING");

  if (whatsappConfigured()) {
    let sent = 0;
    const errors: string[] = [];
    for (const d of pending) {
      const student = await students.byId(d.studentId);
      const r = await remindDue(d, student, tutor);
      if (r.ok) sent++;
      else errors.push(`${student.name}: ${r.error}`);
    }
    return NextResponse.json({ ok: true, mode: "sent", sent, errors });
  }

  const queue = [];
  for (const d of pending) {
    const student = await students.byId(d.studentId);
    const r = await remindDue(d, student, tutor);
    queue.push({ dueId: d.id, name: student.name, shareUrl: r.shareUrl });
  }
  return NextResponse.json({ ok: true, mode: "queue", queue });
}
