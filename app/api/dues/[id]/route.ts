import { NextResponse } from "next/server";
import { dues, students } from "@/lib/db";
import { getCurrentTutor } from "@/lib/auth";

// PATCH /api/dues/:id { status: "PAID"|"PENDING", paymentMethod? }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const tutor = await getCurrentTutor();
  if (!tutor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const due = await dues.byId(params.id);
  const student = due ? await students.byId(due.studentId) : undefined;
  if (!due || !student || student.tutorId !== tutor.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const b = await req.json();
  if (b.status === "PAID") {
    await dues.markPaid(params.id, b.paymentMethod || "UPI_MANUAL");
  } else {
    await dues.markPending(params.id);
  }
  return NextResponse.json({ due: await dues.byId(params.id) });
}
