import { dues, students, reminderLogs, type Due, type Student, type Tutor } from "./db";
import { reminderMessage, waShareLink, monthLabel } from "./messages";
import { whatsappConfigured, sendWhatsAppTemplate } from "./whatsapp";
import { upiDeepLink } from "./payments";

export function payUrlFor(due: Due, student: Student, tutor: Tutor) {
  return (
    due.razorpayLinkUrl ||
    (tutor.upiId
      ? upiDeepLink({
          upiId: tutor.upiId,
          payeeName: tutor.businessName || tutor.name,
          amount: due.amount,
          note: `Fee ${student.name} ${monthLabel(due.month)}`,
        })
      : "(pay link not set — add your UPI ID in Settings)")
  );
}

// Sends via WhatsApp API when configured; otherwise returns a wa.me share URL.
export async function remindDue(
  due: Due,
  student: Student,
  tutor: Tutor
): Promise<{ ok: boolean; channel: string; shareUrl?: string; error?: string }> {
  const label = monthLabel(due.month);
  const payUrl = payUrlFor(due, student, tutor);

  if (whatsappConfigured()) {
    const result = await sendWhatsAppTemplate({
      toPhone: student.parentPhone,
      parentName: student.parentName,
      studentName: student.name,
      monthLabel: label,
      amount: due.amount,
      payUrl,
    });
    await reminderLogs.create({
      dueId: due.id,
      channel: "WHATSAPP_API",
      status: result.ok ? "SENT" : "FAILED",
      detail: result.detail,
    });
    return result.ok
      ? { ok: true, channel: "WHATSAPP_API" }
      : { ok: false, channel: "WHATSAPP_API", error: result.detail };
  }

  const text = reminderMessage(tutor.msgLanguage, {
    parentName: student.parentName,
    studentName: student.name,
    monthLabel: label,
    amount: due.amount,
    tutorName: tutor.name,
    businessName: tutor.businessName,
    payUrl,
  });
  const shareUrl = waShareLink(student.parentPhone, text);
  await reminderLogs.create({
    dueId: due.id,
    channel: "SHARE_LINK",
    status: "SENT",
    detail: "",
  });
  return { ok: true, channel: "SHARE_LINK", shareUrl };
}

export { dues, students };
