import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentTutor } from "@/lib/auth";

const features = [
  {
    title: "One-tap reminders",
    body: "Polite Hinglish or English WhatsApp messages with the amount and a payment link — no typing, no awkwardness.",
  },
  {
    title: "Money lands directly",
    body: "UPI or Razorpay links paid straight to you. Online payments mark themselves as paid automatically.",
  },
  {
    title: "Always know who's pending",
    body: "A clean monthly board of collected vs pending, with shareable receipts for every payment.",
  },
];

export default async function Home() {
  const tutor = await getCurrentTutor();
  if (tutor) redirect("/dashboard");

  return (
    <main className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      <div className="anim-fade-up">
        <span className="chip border border-emerald-200/60 bg-emerald-50/80 text-emerald-700">
          For tutors &amp; coaching classes
        </span>
        <h1 className="font-display mt-6 text-5xl font-semibold tracking-tight sm:text-6xl">
          Fee<span className="text-emerald-700">Saathi</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
          Stop chasing tuition fees. Add your students once — FeeSaathi sends
          WhatsApp reminders with payment links and quietly tracks who has paid.
        </p>
        <div className="mt-9 flex items-center justify-center gap-3">
          <Link href="/register" className="btn-primary px-7 py-3.5 text-base">
            Get started free
          </Link>
          <Link href="/login" className="btn-ghost px-7 py-3.5 text-base">
            Login
          </Link>
        </div>
        <p className="mt-5 text-sm text-slate-400">
          Free for up to 10 students · Parents don&apos;t need any app
        </p>
      </div>

      <div className="stagger mt-16 grid w-full gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="card card-hover p-6 text-left">
            <h3 className="font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
