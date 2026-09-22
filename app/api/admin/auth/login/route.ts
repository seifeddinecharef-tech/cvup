import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  secureCompare,
} from "@/lib/admin-session";

export async function POST(request: Request) {
  const expectedEmail = process.env.CVUP_ADMIN_EMAIL?.trim().toLowerCase();
  const expectedPassword = process.env.CVUP_ADMIN_PASSWORD;

  if (!expectedEmail || !expectedPassword || !process.env.CVUP_ADMIN_SESSION_SECRET) {
    return NextResponse.json(
      { error: "Admin authentication is not configured." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() || "";
  const password = body.password || "";

  const [emailMatches, passwordMatches] = await Promise.all([
    secureCompare(email, expectedEmail),
    secureCompare(password, expectedPassword),
  ]);

  if (!emailMatches || !passwordMatches) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

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
