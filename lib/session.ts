// Signed admin session tokens.
//
// Uses only the Web Crypto API so the same code runs in API routes (Node)
// and in middleware (Edge runtime).
//
// Token format: "<expiresAtMs>.<hex HMAC-SHA256 of 'admin:<expiresAtMs>'>"
// The signing key combines SESSION_SECRET (optional) with ADMIN_PASSWORD, so
// changing the admin password immediately signs everyone out.

export const SESSION_COOKIE = "admin_session";
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function getAdminPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  return pw && pw.length > 0 ? pw : null;
}

async function getKey(): Promise<CryptoKey | null> {
  const pw = getAdminPassword();
  if (!pw) return null; // No password configured: nobody can sign in.
  const secret = `${process.env.SESSION_SECRET ?? ""}|${pw}`;
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Constant-time string comparison.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sign(payload: string): Promise<string | null> {
  const key = await getKey();
  if (!key) return null;
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toHex(sig);
}

async function sha256Hex(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

/** True only if ADMIN_PASSWORD is set and the given password matches it. */
export async function checkPassword(password: string): Promise<boolean> {
  const expected = getAdminPassword();
  if (!expected || typeof password !== "string") return false;
  // Compare hashes so the comparison length doesn't depend on the input.
  return safeEqual(await sha256Hex(password), await sha256Hex(expected));
}

/** Creates a signed token, or null if no admin password is configured. */
export async function createSessionToken(): Promise<string | null> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const sig = await sign(`admin:${expiresAt}`);
  return sig ? `${expiresAt}.${sig}` : null;
}

/** True only for an unexpired token signed with the current key. */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expiresStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(expiresStr)) return false;
  const expiresAt = Number(expiresStr);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const expected = await sign(`admin:${expiresStr}`);
  if (!expected) return false;
  return safeEqual(sig, expected);
}
