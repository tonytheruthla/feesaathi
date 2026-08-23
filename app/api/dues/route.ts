import { NextResponse } from "next/server";
import { dues } from "@/lib/db";
import { getCurrentTutor } from "@/lib/auth";

// GET /api/dues?month=2026-08 — dues board for a month
export async function GET(req: Request) {
  const tutor = await getCurrentTutor();
  if (!tutor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const month =
    searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const board = await dues.boardForMonth(tutor.id, month);
  const collected = board
    .filter((d) => d.status === "PAID")
    .reduce((s, d) => s + d.amount, 0);
  const pending = board
    .filter((d) => d.status === "PENDING")
    .reduce((s, d) => s + d.amount, 0);
  return NextResponse.json({ month, dues: board, collected, pending });
}
