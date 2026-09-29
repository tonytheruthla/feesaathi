import crypto from "crypto";
import { q, tutors } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { verifyGoogleIdToken } from "@/lib/google";

// Shared by the popup flow (POST /api/auth/google) and the redirect flow used
// inside the installed Android app (POST /api/auth/google/callback).
// Returns the tutor id to log in, creating the tutor on first Google sign-in.
export async function tutorFromGoogleCredential(
  credential: string
): Promise<{ tutorId: string; created: boolean } | { error: string; status: number }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return { error: "Google sign-in is not set up yet", status: 503 };

  let profile;
  try {
    profile = await verifyGoogleIdToken(credential, clientId);
  } catch {
    return { error: "Google sign-in failed. Please try again.", status: 401 };
  }

  const found = await q<{ id: string }>(
    `SELECT id FROM tutor WHERE lower(email) = $1 LIMIT 1`,
    [profile.email]
  );
  if (found[0]) return { tutorId: found[0].id, created: false };

  // Google users have no password. Store a random, unusable hash so the
  // NOT NULL column is satisfied and password login stays impossible.
  const tutor = await tutors.create({
    name: profile.name,
    email: profile.email,
    passwordHash: await hashPassword(crypto.randomBytes(32).toString("hex")),
    businessName: "",
    upiId: "",
  });
  if (!tutor) return { error: "Could not create your account", status: 500 };
  return { tutorId: tutor.id, created: true };
}
