"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"/>
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"/>
      <path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.55l3.35-2.62Z"/>
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"/>
    </svg>
  );
}

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const oauthError = searchParams.get("error");

  async function signInWithGoogle() {
    setSubmitting(true);
    setMessage(null);
    try {
      const nextParam = searchParams.get("next");
      const next = nextParam?.startsWith("/admin") ? nextParam : "/admin";
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", next);
      callback.searchParams.set("admin", "1");

      const { data, error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callback.toString(),
          skipBrowserRedirect: true,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
      if (!data.url) throw new Error("Google sign-in URL was not returned.");
      window.location.assign(data.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google sign-in failed.");
      setSubmitting(false);
    }
  }

  const errorText =
    oauthError === "unauthorized_account"
      ? "This Google account is not authorized for CVUp Admin."
      : oauthError
        ? "Google sign-in could not be completed. Please try again."
        : null;

  return (
    <main className="admin-login-shell">
      <div className="admin-login-orb admin-login-orb--one" />
      <div className="admin-login-orb admin-login-orb--two" />
      <section className="admin-login-card">
        <div className="admin-login-brand">
          <span className="brand-logo-circle admin-login-logo">
            <Image src="/brand/cvup-logo.png" alt="CVUp" width={58} height={58} className="brand-logo" priority />
          </span>
          <div><strong>CVUp</strong><span>Admin workspace</span></div>
        </div>

        <div className="admin-login-copy">
          <span className="admin-login-secure"><span aria-hidden="true">●</span> Secure admin access</span>
          <h1>Welcome back</h1>
          <p>Sign in with the authorized CVUp Google account to manage client dossiers and payments.</p>
        </div>

        {(message || errorText) ? <p className="admin-login-error">{message || errorText}</p> : null}

        <button className="admin-google-button" type="button" onClick={signInWithGoogle} disabled={submitting}>
          <span className="admin-google-icon"><GoogleIcon /></span>
          <span>{submitting ? "Opening Google…" : "Continue with Google"}</span>
          <span className="admin-google-arrow" aria-hidden="true">→</span>
        </button>

        <div className="admin-login-footnote">
          <span aria-hidden="true">◉</span>
          <p>Access is restricted to the authorized administrator account.</p>
        </div>
      </section>
      <p className="admin-login-copyright">CVUp · Secure workspace</p>
    </main>
  );
}
