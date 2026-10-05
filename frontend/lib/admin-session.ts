import "server-only";

// Uses Web Crypto (SubtleCrypto) instead of node:crypto so this works
// unmodified in both the Node.js runtime and the Edge runtime (middleware
// defaults to Edge).
export const ADMIN_SESSION_COOKIE = "admin_session";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 12; // 12h
export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000;

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set");
  }
  return secret;
}

function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.floor(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export async function createSessionCookieValue(): Promise<string> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = String(expiresAt);
  const key = await getKey();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return `${payload}.${toHex(signature)}`;
}

export async function isValidSessionCookieValue(
  value: string | undefined | null,
): Promise<boolean> {
  if (!value) return false;

  const [payload, signatureHex] = value.split(".");
  if (!payload || !signatureHex) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  const key = await getKey();
  return crypto.subtle.verify(
    "HMAC",
    key,
    fromHex(signatureHex) as BufferSource,
    new TextEncoder().encode(payload),
  );
}
