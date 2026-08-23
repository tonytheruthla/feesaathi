import { NextResponse } from "next/server";
import { tutors } from "@/lib/db";
import { getCurrentTutor } from "@/lib/auth";
import { whatsappConfigured } from "@/lib/whatsapp";
import { razorpayConfigured } from "@/lib/payments";

export async function GET() {
  const tutor = await getCurrentTutor();
  if (!tutor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    tutor: {
      name: tutor.name,
      email: tutor.email,
      businessName: tutor.businessName,
      phone: tutor.phone,
      upiId: tutor.upiId,
      msgLanguage: tutor.msgLanguage,
    },
    integrations: {
      whatsappApi: whatsappConfigured(),
      razorpay: razorpayConfigured(),
    },
  });
}

export async function PATCH(req: Request) {
  const tutor = await getCurrentTutor();
  if (!tutor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  const data: Record<string, string> = {};
  for (const k of ["name", "businessName", "phone", "upiId", "msgLanguage"]) {
    if (typeof b[k] === "string") data[k] = b[k];
  }
  const updated = await tutors.update(tutor.id, data);
  return NextResponse.json({ ok: true, tutor: { name: updated.name } });
}
