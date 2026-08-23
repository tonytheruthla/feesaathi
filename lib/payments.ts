// Payments: Razorpay Payment Links when keys are configured (auto-confirm
// via webhook), else a upi:// deep link to the tutor's own UPI ID
// (tutor marks paid manually).

import Razorpay from "razorpay";

export function razorpayConfigured() {
  return Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  );
}

function client() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

export async function createPaymentLink(opts: {
  amount: number; // rupees
  description: string;
  customerName: string;
  customerPhone: string;
  referenceId: string; // our due id
}): Promise<{ id: string; url: string }> {
  const rzp = client();
  const link = await rzp.paymentLink.create({
    amount: opts.amount * 100, // paise
    currency: "INR",
    description: opts.description,
    reference_id: opts.referenceId,
    customer: {
      name: opts.customerName,
      contact: `+${opts.customerPhone.replace(/[^\d]/g, "")}`,
    },
    notify: { sms: false, email: false },
    reminder_enable: false,
  });
  return { id: link.id as string, url: link.short_url as string };
}

// UPI deep link fallback — opens any UPI app with amount prefilled.
export function upiDeepLink(opts: {
  upiId: string;
  payeeName: string;
  amount: number;
  note: string;
}) {
  const params = new URLSearchParams({
    pa: opts.upiId,
    pn: opts.payeeName,
    am: String(opts.amount),
    cu: "INR",
    tn: opts.note.slice(0, 60),
  });
  return `upi://pay?${params.toString()}`;
}
