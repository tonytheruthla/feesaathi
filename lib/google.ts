import crypto from "crypto";

// Verifies a Google Identity Services ID token (the "credential" returned by
// the Sign in with Google button). Only the public client ID is needed; no
// client secret is involved in this flow.

const CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const ISSUERS = ["accounts.google.com", "https://accounts.google.com"];

type Jwk = crypto.JsonWebKey & { kid: string };
let cache: { keys: Jwk[]; expires: number } | null = null;

async function googleKeys(force = false): Promise<Jwk[]> {
  if (!force && cache && cache.expires > Date.now()) return cache.keys;
  const res = await fetch(CERTS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Could not fetch Google keys");
  const { keys } = (await res.json()) as { keys: Jwk[] };
  const maxAge = /max-age=(\d+)/.exec(res.headers.get("cache-control") || "");
  cache = { keys, expires: Date.now() + (maxAge ? +maxAge[1] : 3600) * 1000 };
  return keys;
}

export type GoogleProfile = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
};

function b64url(s: string) {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export async function verifyGoogleIdToken(
  token: string,
  clientId: string,
  getKeys: (force?: boolean) => Promise<Jwk[]> = googleKeys
): Promise<GoogleProfile> {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new Error("Malformed token");
  const [h, p, sig] = parts;
  const header = JSON.parse(b64url(h).toString("utf8"));
  if (header.alg !== "RS256") throw new Error("Unexpected algorithm");

  let jwk = (await getKeys()).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await getKeys(true)).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("Unknown signing key");

  const key = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const ok = crypto.verify("RSA-SHA256", Buffer.from(`${h}.${p}`), key, b64url(sig));
  if (!ok) throw new Error("Bad signature");

  const c = JSON.parse(b64url(p).toString("utf8"));
  const now = Math.floor(Date.now() / 1000);
  if (!ISSUERS.includes(c.iss)) throw new Error("Bad issuer");
  if (c.aud !== clientId) throw new Error("Token not issued for this app");
  if (typeof c.exp !== "number" || c.exp < now - 60) throw new Error("Token expired");
  if (!c.email || c.email_verified !== true) throw new Error("Email not verified by Google");

  return {
    sub: String(c.sub),
    email: String(c.email).toLowerCase(),
    name: String(c.name || c.given_name || c.email.split("@")[0]),
    picture: c.picture,
  };
}
