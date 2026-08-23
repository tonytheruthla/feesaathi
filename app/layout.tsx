import type { Metadata } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/fraunces";
import "./globals.css";

export const metadata: Metadata = {
  title: "FeeSaathi — Tuition fee collection on WhatsApp",
  description:
    "Add students once. FeeSaathi sends fee reminders with payment links on WhatsApp and tracks who has paid.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-900">{children}</body>
    </html>
  );
}
