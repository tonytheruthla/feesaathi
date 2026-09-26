import { iconImage } from "@/components/icon-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return iconImage(512);
}
