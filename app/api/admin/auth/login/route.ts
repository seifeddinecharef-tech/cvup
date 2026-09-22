import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  secureCompare,
} from "@/lib/admin-session";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "local";
}

export async function POST(request: Request) {
  const expectedEmail = process.env.CVUP_ADMIN_EMAIL?.trim().toLowerCase();
  const expectedPassword = process.env.CVUP_ADMIN_PASSWORD;

  if (!expectedEmail || !expectedPassword || !process.env.CVUP_ADMIN_SESSION_SECRET) {
    return NextResponse.json(
      { error: "Admin authentication is not configured." },
      { status: 503 }
    );
  }

  const key = clientKey(request);
  const now = Date.now();
  const current = attempts.get(key);

  if (current && current.resetAt > now && current.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  if (current && current.resetAt <= now) attempts.delete(key);

  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() || "";
  const password = body.password || "";

  const [emailMatches, passwordMatches] = await Promise.all([
    secureCompare(email, expectedEmail),
    secureCompare(password, expectedPassword),
  ]);

  if (!emailMatches || !passwordMatches) {
    const previous = attempts.get(key);
    attempts.set(key, {
      count: (previous?.count || 0) + 1,
      resetAt: previous?.resetAt && previous.resetAt > now ? previous.resetAt : now + WINDOW_MS,
    });
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  attempts.delete(key);
  const token = await createAdminSessionToken(email);
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  return NextResponse.json({ success: true });
}
