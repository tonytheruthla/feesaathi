import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Digital Asset Links for the Android app (Trusted Web Activity). Lets the
// Play Store app open app.feesaathi.com full-screen without a browser bar.
// Set in Render: ANDROID_PACKAGE (default com.feesaathi.app) and
// ANDROID_CERT_SHA256 = comma-separated SHA-256 fingerprints (upload key and
// Play App Signing key, both from Play Console → App integrity).
export function GET() {
  const pkg = process.env.ANDROID_PACKAGE || "com.feesaathi.app";
  const prints = (process.env.ANDROID_CERT_SHA256 || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s));
  const body = prints.length
    ? [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: prints },
        },
      ]
    : [];
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
