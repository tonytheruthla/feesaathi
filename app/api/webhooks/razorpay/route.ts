import { NextResponse } from "next/server";
import crypto from "crypto";
import { dues } from "@/lib/db";

// Razorpay webhook — set URL to {APP_URL}/api/webhooks/razorpay in the
// Razorpay dashboard, event: payment_link.paid, and put the webhook
// secret in RAZORPAY_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const raw = await req.text();

  if (secret) {
    const signature = req.headers.get("x-razorpay-signature") || "";
    const expected = crypto
      .createHmac("sha256", secret)
      .update(raw)
      .digest("hex");
    if (
      signature.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const event = JSON.parse(raw);
  if (event.event === "payment_link.paid") {
    const entity = event.payload?.payment_link?.entity;
    const referenceId: string | undefined = entity?.reference_id;
    const linkId: string | undefined = entity?.id;
    const due =
      (referenceId && (await dues.byId(referenceId))) ||
      (linkId && (await dues.byRazorpayLinkId(linkId))) ||
      null;
    if (due && due.status !== "PAID") {
      await dues.markPaid(due.id, "RAZORPAY");
    }
  }
  return NextResponse.json({ ok: true });
}
