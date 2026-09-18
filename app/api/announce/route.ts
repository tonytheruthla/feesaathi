import { NextResponse } from "next/server";
import { students } from "@/lib/db";
import { getCurrentTutor } from "@/lib/auth";
import { waShareLink } from "@/lib/messages";

// POST /api/announce { message, batch? }
// Broadcast an announcement to parents on WhatsApp. v1 always returns a
// wa.me share-link queue (works with the tutor's own WhatsApp, zero setup);
// WhatsApp Cloud API announcements need an approved template, so that
// channel is deliberately not used here yet.
export async function POST(req: Request) {
  const tutor = await getCurrentTutor();
  if (!tutor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const message = String(body.message || "").trim();
  const batch = String(body.batch || "").trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const all = await students.list(tutor.id);
  const targets = all.filter(
    (s: { active: boolean | number; batch: string }) =>
      s.active && (!batch || s.batch === batch)
  );

  const from = tutor.businessName || tutor.name;
  const text = message + "\n\n— " + from + "\n_Sent via FeeSaathi_";

  // One message per parent phone, even if siblings share a parent.
  const seen = new Set<string>();
  const queue = [];
  for (const s of targets) {
    if (seen.has(s.parentPhone)) continue;
    seen.add(s.parentPhone);
    queue.push({
      studentId: s.id,
      name: s.parentName || s.name,
      shareUrl: waShareLink(s.parentPhone, text),
    });
  }

  return NextResponse.json({ ok: true, mode: "queue", queue });
}
