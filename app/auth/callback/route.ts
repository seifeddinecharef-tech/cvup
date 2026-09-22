import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
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

  const response = NextResponse.redirect(new URL(safeNext, request.url));
  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user?.email) {
    console.error("Supabase OAuth callback failed:", error?.message || "No authenticated user returned.");
    return loginError(request, "oauth", adminFlow);
  }

  if (adminFlow) {
    const allowedEmail = process.env.CVUP_ADMIN_EMAIL?.trim().toLowerCase();
    const signedInEmail = data.user.email.trim().toLowerCase();
    if (!allowedEmail || signedInEmail !== allowedEmail) {
      return loginError(request, "unauthorized_account", true);
    }

    const token = await createAdminSessionToken(signedInEmail);
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
  }

  return response;
}
