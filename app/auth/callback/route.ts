import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/account";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  if (!code) return NextResponse.redirect(new URL("/account/login?error=oauth", request.url));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!supabaseUrl || !publishableKey) return NextResponse.redirect(new URL("/account/login?error=config", request.url));

  const response = NextResponse.redirect(new URL(safeNext, request.url));
  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { "X-Client-Info": "cvup-oauth-callback" } },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session) return NextResponse.redirect(new URL("/account/login?error=oauth", request.url));

  const secure = process.env.NODE_ENV === "production";
  const maxAge = Math.max(60, data.session.expires_in || 3600);
  response.cookies.set("cvup-access-token", data.session.access_token, { httpOnly: false, sameSite: "lax", secure, path: "/", maxAge });
  response.cookies.set("cvup-refresh-token", data.session.refresh_token, { httpOnly: false, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 30 });

  // Browser client restores the session from the URL/session flow on the account page.
  const handoff = new URL("/auth/complete", request.url);
  handoff.searchParams.set("access_token", data.session.access_token);
  handoff.searchParams.set("refresh_token", data.session.refresh_token);
  handoff.searchParams.set("next", safeNext);
  return NextResponse.redirect(handoff);
}
