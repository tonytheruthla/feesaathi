import { NextResponse } from "next/server";
import { classSlots } from "@/lib/db";
import { getCurrentTutor } from "@/lib/auth";

export async function GET() {
  const tutor = await getCurrentTutor();
  if (!tutor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ slots: await classSlots.list(tutor.id) });
}

export async function POST(req: Request) {
  const tutor = await getCurrentTutor();
  if (!tutor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (b.batch === undefined || b.dayOfWeek === undefined || !b.startTime) {
    return NextResponse.json(
      { error: "Batch, day and start time are required" },
      { status: 400 }
    );
  }
  const slot = await classSlots.create({
    tutorId: tutor.id,
    batch: b.batch || "All students",
    dayOfWeek: Number(b.dayOfWeek),
    startTime: b.startTime,
    endTime: b.endTime || "",
  });
  return NextResponse.json({ slot });
}
