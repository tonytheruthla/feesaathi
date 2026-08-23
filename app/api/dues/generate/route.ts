import { NextResponse } from "next/server";
import { students, dues } from "@/lib/db";
import { getCurrentTutor } from "@/lib/auth";
import { razorpayConfigured, createPaymentLink } from "@/lib/payments";
import { monthLabel } from "@/lib/messages";

// POST /api/dues/generate { month?: "2026-08" }
// Creates a due for every active student that doesn't have one yet.
// If Razorpay is configured, also creates payment links.
export async function POST(req: Request) {
  const tutor = await getCurrentTutor();
  if (!tutor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const month = body.month || new Date().toISOString().slice(0, 7);

  const roster = await students.listActive(tutor.id);
  let created = 0;
  const errors: string[] = [];

  for (const s of roster) {
    if (await dues.byStudentMonth(s.id, month)) continue;
    const due = await dues.create(s.id, month, s.monthlyFee);
    created++;
    if (razorpayConfigured()) {
      try {
        const link = await createPaymentLink({
          amount: s.monthlyFee,
          description: `Tuition fee — ${s.name} — ${monthLabel(month)}`,
          customerName: s.parentName || s.name,
          customerPhone: s.parentPhone,
          referenceId: due.id,
        });
        await dues.setRazorpayLink(due.id, link.id, link.url);
      } catch (e) {
        errors.push(`${s.name}: payment link failed (${String(e).slice(0, 120)})`);
      }
    }
  }
  return NextResponse.json({ ok: true, month, created, errors });
}
