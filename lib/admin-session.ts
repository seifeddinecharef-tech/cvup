const encoder = new TextEncoder();

export const ADMIN_SESSION_COOKIE = "cvup_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

type AdminSessionPayload = {
  email: string;
  exp: number;
};

function base64UrlEncodeBytes(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlEncodeText(value: string) {
  return base64UrlEncodeBytes(encoder.encode(value));
}

function base64UrlDecodeText(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

function getSessionSecret() {
  const secret = process.env.CVUP_ADMIN_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("CVUP_ADMIN_SESSION_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

export async function createAdminSessionToken(email: string) {
  const payload: AdminSessionPayload = {
    email: email.toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE,
  };
  const encodedPayload = base64UrlEncodeText(JSON.stringify(payload));
  const signature = await hmac(encodedPayload, getSessionSecret());
  return `${encodedPayload}.${signature}`;
}

export async function verifyAdminSessionToken(token?: string | null): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  try {
    const [encodedPayload, suppliedSignature] = token.split(".");
    if (!encodedPayload || !suppliedSignature) return null;

    const expectedSignature = await hmac(encodedPayload, getSessionSecret());
    if (expectedSignature.length !== suppliedSignature.length) return null;

    let mismatch = 0;
    for (let index = 0; index < expectedSignature.length; index += 1) {
      mismatch |= expectedSignature.charCodeAt(index) ^ suppliedSignature.charCodeAt(index);
    }
    if (mismatch !== 0) return null;

    const payload = JSON.parse(base64UrlDecodeText(encodedPayload)) as AdminSessionPayload;
    if (!payload.email || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;

    const allowedEmail = process.env.CVUP_ADMIN_EMAIL?.trim().toLowerCase();
    if (!allowedEmail || payload.email !== allowedEmail) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function secureCompare(left: string, right: string) {
  const [leftDigest, rightDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const a = new Uint8Array(leftDigest);
  const b = new Uint8Array(rightDigest);
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) mismatch |= a[index] ^ b[index];
  return mismatch === 0;
}
