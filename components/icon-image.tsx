import { ImageResponse } from "next/og";
import { MARK_PATH } from "./Logo";

/** Full-bleed maskable app icon (emerald tile, white mark in the safe zone), rendered as PNG. */
export function iconImage(size: number) {
  const pad = Math.round(size * 0.1875);
  const inner = size - pad * 2;
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: "#059669" }}>
        <svg viewBox="0 0 1000 1000" width={inner} height={inner}>
          <path fill="#ffffff" fillRule="evenodd" d={MARK_PATH} />
        </svg>
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
