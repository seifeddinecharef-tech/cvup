const encoder = new TextEncoder();

const REQUEST_TOKEN_MAX_AGE = 60 * 30;

type RequestTokenPayload = {
  requestId: string;
  requestCode: string;
  exp: number;
};

function getSecret() {
  const secret =
    process.env.CVUP_REQUEST_TOKEN_SECRET?.trim() ||
    process.env.CVUP_ADMIN_SESSION_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new Error("A request token secret with at least 32 characters is required.");
  }

  return secret;
}

function encodeBytes(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function encodeText(value: string) {
  return encodeBytes(encoder.encode(value));
}

function decodeText(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return encodeBytes(new Uint8Array(signature));
}

export async function createRequestSubmissionToken(requestId: string, requestCode: string) {
  const payload: RequestTokenPayload = {
    requestId,
    requestCode,
    exp: Math.floor(Date.now() / 1000) + REQUEST_TOKEN_MAX_AGE,
  };
  const encoded = encodeText(JSON.stringify(payload));
  return `${encoded}.${await sign(encoded)}`;
}

export async function verifyRequestSubmissionToken(token?: string | null): Promise<RequestTokenPayload | null> {
  if (!token) return null;

  try {
    const [encoded, suppliedSignature] = token.split(".");
    if (!encoded || !suppliedSignature) return null;

    const expectedSignature = await sign(encoded);
    if (expectedSignature.length !== suppliedSignature.length) return null;

    let mismatch = 0;
    for (let index = 0; index < expectedSignature.length; index += 1) {
      mismatch |= expectedSignature.charCodeAt(index) ^ suppliedSignature.charCodeAt(index);
    }
    if (mismatch !== 0) return null;

    const payload = JSON.parse(decodeText(encoded)) as RequestTokenPayload;
    if (!payload.requestId || !payload.requestCode || !payload.exp) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}
