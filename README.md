# FeeSaathi

Tuition fee collection on WhatsApp for solo tutors and small coaching classes.
Add students once → generate monthly dues → send WhatsApp reminders with a
payment link → track who has paid → share receipts.

## Stack

Next.js 14 (App Router) · better-sqlite3 · Tailwind · JWT cookie auth.
Single deployable app, SQLite file database — runs on any ₹300/mo VPS or a
Node host (Railway/Render). Note: SQLite means one persistent server, not
serverless — do NOT deploy to Vercel without swapping the DB layer.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

The database file (`feesaathi.db`) is created automatically on first run.

## Deploy checklist

1. Set env vars (see `.env`): change `JWT_SECRET`, set `APP_URL` to your domain.
2. `npm run build && npm start` behind nginx/caddy, or push to Railway/Render
   (add a persistent volume for `feesaathi.db`, set `DATABASE_FILE` to a path on it).
3. Back up `feesaathi.db` daily (it's a single file — a cron + rclone is enough).

## Integrations — the app works in two modes

### Mode 1 (day one, zero setup): share-link + UPI fallback
- "Remind" opens a prefilled Hinglish/English message in the tutor's own
  WhatsApp (wa.me) — one tap per parent.
- The message carries a `upi://pay` deep link to the tutor's UPI ID —
  money lands directly, tutor taps "Mark paid".

### Mode 2 (automatic, after onboarding): WhatsApp Cloud API + Razorpay

**WhatsApp Cloud API** (auto-send reminders):
1. Create a Meta Business account + app at developers.facebook.com → add the
   WhatsApp product. Business verification takes days to ~3 weeks.
2. Register a phone number (cannot be a number actively used on the WhatsApp app).
3. Create a **template** named `fee_reminder` (or change `WHATSAPP_TEMPLATE_NAME`)
   with body:
   `Dear {{1}}, tuition fee for {{2}} for {{3}} of {{4}} is due. Pay here: {{5}}`
   and get it approved (template approval is usually <24h).
4. Put the permanent token + phone number ID in `.env`
   (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`). Done — "Remind" now sends
   automatically and logs delivery.
   Pricing note: business-initiated ("utility") messages cost ~₹0.12–0.35 each in India.

**Razorpay** (online payment + auto-mark-paid):
1. Complete Razorpay KYC (individual/proprietor works).
2. Put `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` in `.env` — new dues now get
   payment links automatically (2% + GST fee applies per payment).
3. Dashboard → Webhooks → add `https://YOURAPP/api/webhooks/razorpay`,
   event `payment_link.paid`, and put the webhook secret in
   `RAZORPAY_WEBHOOK_SECRET` — payments now mark themselves paid.

Both integrations are detected from env vars — no code changes, no redeploy
logic. Settings page shows connection status.

## Structure

```
lib/db.ts          SQLite schema + data access (tutors/students/dues/logs)
lib/auth.ts        JWT cookie sessions
lib/messages.ts    Hinglish/English templates + wa.me links
lib/whatsapp.ts    WhatsApp Cloud API sender
lib/payments.ts    Razorpay payment links + upi:// fallback
app/api/*          REST routes (auth, students, dues, remind, webhook, settings)
app/dashboard      Monthly dues board (collected/pending, remind, mark paid)
app/students       Roster CRUD
app/settings       Profile, UPI ID, language, integration status
app/receipt/[id]   Printable receipt (print → save as PDF)
```

## Roadmap (post-MVP)
- "Remind all pending" bulk action + auto-remind scheduler (cron)
- Payment receipt auto-message on webhook
- Free tier limit (10 students) + Razorpay subscription for ₹99–199/mo Pro
- Reskin: society/apartment maintenance dues (same engine)
