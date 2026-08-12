const COOKIE_NAME = "flash_session";

function getSecret() {
  return process.env.SESSION_SECRET || process.env.APP_PASSWORD || "dev-secret";
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(): Promise<string> {
  const payload = `ok:${Date.now()}`;
  const sig = await hmacHex(payload, getSecret());
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = await hmacHex(payload, getSecret());
  if (expected.length !== sig.length) return false;
  let ok = 0;
  for (let i = 0; i < expected.length; i++) {
    ok |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return ok === 0;
}

export function checkPassword(password: string): boolean {
  const expected = process.env.APP_PASSWORD ?? "flashcard";
  if (password.length !== expected.length) return false;
  let ok = 0;
  for (let i = 0; i < expected.length; i++) {
    ok |= password.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return ok === 0;
}

/** Returns true when APP_PASSWORD is empty — open access for local demo */
export function isAuthDisabled(): boolean {
  return process.env.APP_PASSWORD === "";
}
