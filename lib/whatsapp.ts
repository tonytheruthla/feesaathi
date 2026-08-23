// WhatsApp Cloud API sender. Active once WHATSAPP_TOKEN and
// WHATSAPP_PHONE_NUMBER_ID are set; otherwise callers fall back to
// wa.me share links (see lib/messages.ts).

export function whatsappConfigured() {
  return Boolean(
    process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

// Sends an approved template message (required for business-initiated
// conversations). Template must be created & approved in Meta Business
// Manager with variables: 1=parent name, 2=student name, 3=month,
// 4=amount, 5=pay link.
export async function sendWhatsAppTemplate(opts: {
  toPhone: string;
  parentName: string;
  studentName: string;
  monthLabel: string;
  amount: number;
  payUrl: string;
}): Promise<{ ok: boolean; detail: string }> {
  const token = process.env.WHATSAPP_TOKEN!;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const template = process.env.WHATSAPP_TEMPLATE_NAME || "fee_reminder";
  const lang = process.env.WHATSAPP_TEMPLATE_LANG || "en";

  const body = {
    messaging_product: "whatsapp",
    to: opts.toPhone.replace(/[^\d]/g, ""),
    type: "template",
    template: {
      name: template,
      language: { code: lang },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: opts.parentName || "Parent" },
            { type: "text", text: opts.studentName },
            { type: "text", text: opts.monthLabel },
            { type: "text", text: `₹${opts.amount}` },
            { type: "text", text: opts.payUrl },
          ],
        },
      ],
    },
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    const json = await res.json();
    if (!res.ok) {
      return { ok: false, detail: JSON.stringify(json.error || json) };
    }
    return { ok: true, detail: json.messages?.[0]?.id || "sent" };
  } catch (e: unknown) {
    return { ok: false, detail: String(e) };
  }
}
