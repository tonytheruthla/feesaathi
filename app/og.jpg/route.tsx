import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import path from "path";
import { MARK_PATH } from "@/components/Logo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMERALD = "#059669";
const INK = "#0b1712";

// Static WOFF files (satori can't read woff2) from the @fontsource packages in node_modules.
function localFont(pkg: string, file: string): ArrayBuffer | null {
  try {
    const buf = readFileSync(path.join(process.cwd(), "node_modules", "@fontsource", pkg, "files", file));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  } catch {
    return null;
  }
}

function Mark({ size, color }: { size: number; color: string }) {
  return (
    <svg viewBox="0 0 1000 1000" width={size} height={size}>
      <path fill={color} fillRule="evenodd" d={MARK_PATH} />
    </svg>
  );
}

export async function GET() {
  const body = "WhatsApp fee reminders, receipts & class updates for tutors. Free for 10 students.";
  const display = localFont("bricolage-grotesque", "bricolage-grotesque-latin-700-normal.woff");
  const sans = localFont("schibsted-grotesk", "schibsted-grotesk-latin-500-normal.woff");
  const sansBold = localFont("schibsted-grotesk", "schibsted-grotesk-latin-700-normal.woff");
  const fonts: { name: string; data: ArrayBuffer; weight: 500 | 700; style: "normal" }[] = [];
  if (display) fonts.push({ name: "Bricolage", data: display, weight: 700, style: "normal" });
  if (sans) fonts.push({ name: "Schibsted", data: sans, weight: 500, style: "normal" });
  if (sansBold) fonts.push({ name: "Schibsted", data: sansBold, weight: 700, style: "normal" });
  const fd = display ? "Bricolage" : "sans-serif";
  const fs = sans ? "Schibsted" : "sans-serif";

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", fontFamily: fs }}>
        <div style={{ width: 720, height: 630, background: "#f3f6f4", padding: "70px 64px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: fd, fontSize: 44, fontWeight: 700, letterSpacing: -1.3 }}>
            <Mark size={56} color={EMERALD} />
            <div style={{ display: "flex" }}>
              <span style={{ color: EMERALD }}>Fee</span>
              <span style={{ color: INK }}>Saathi</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 34, fontFamily: fd, fontSize: 58, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2, color: INK, whiteSpace: "nowrap" }}>
            <div>Fees time pe</div>
            <div>aati hai?</div>
            <div style={{ color: EMERALD }}>Matlab FeeSaathi hai.</div>
          </div>
          <div style={{ marginTop: 22, fontSize: 22, lineHeight: 1.4, color: "#55645d", width: 560 }}>{body}</div>
          <div style={{ display: "flex", marginTop: 28 }}>
            <div style={{ background: INK, color: "#fff", fontWeight: 700, fontSize: 24, padding: "16px 28px", borderRadius: 999 }}>app.feesaathi.com</div>
          </div>
        </div>
        <div style={{ width: 480, height: 630, display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: "linear-gradient(135deg, #047857, #065f46 55%, #134e4a)" }}>
          <Mark size={300} color="#ffffff" />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      ...(fonts.length ? { fonts } : {}),
      headers: { "Cache-Control": "public, max-age=86400" },
    }
  );
}
