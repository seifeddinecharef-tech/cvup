import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
} from "@/lib/admin-session";

function loginError(request: NextRequest, reason: string, admin: boolean) {
  const path = admin ? "/admin/login" : "/account/login";
  const url = new URL(path, request.url);
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const adminFlow = url.searchParams.get("admin") === "1";
  const next = url.searchParams.get("next") || (adminFlow ? "/admin" : "/account");
  const fallback = adminFlow ? "/admin" : "/account";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : fallback;

  if (!code) return loginError(request, "oauth", adminFlow);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!supabaseUrl || !publishableKey) return loginError(request, "config", adminFlow);

  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session || !data.user?.email) return loginError(request, "oauth", adminFlow);

  if (adminFlow) {
    const allowedEmail = process.env.CVUP_ADMIN_EMAIL?.trim().toLowerCase();
    const signedInEmail = data.user.email.trim().toLowerCase();
    if (!allowedEmail || signedInEmail !== allowedEmail) {
      return loginError(request, "unauthorized_account", true);
    }

    const response = NextResponse.redirect(new URL(safeNext.startsWith("/admin") ? safeNext : "/admin", request.url));
    const token = await createAdminSessionToken(signedInEmail);
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
    return response;
  }

  const handoff = new URL("/auth/complete", request.url);
  handoff.searchParams.set("access_token", data.session.access_token);
  handoff.searchParams.set("refresh_token", data.session.refresh_token);
  handoff.searchParams.set("next", safeNext);
  return NextResponse.redirect(handoff);
}
