"use client";

import Image from "next/image";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"/>
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"/>
      <path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.55l3.35-2.62Z"/>
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"/>
    </svg>
  );
}

export default function AdminLoginPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function signInWithGoogle() {
    setSubmitting(true);
    setMessage(null);
    try {
      const nextParam = new URLSearchParams(window.location.search).get("next");
      const next = nextParam?.startsWith("/admin") ? nextParam : "/admin";
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", next);
      callback.searchParams.set("admin", "1");

      const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callback.toString() },
      });
      if (error) throw error;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google sign-in failed.");
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <div className="admin-login-brand">
          <span className="brand-logo-circle brand-logo-circle--compact">
            <Image src="/brand/cvup-logo.png" alt="CVUp" width={42} height={42} className="brand-logo" priority />
          </span>
          <div><strong>CVUp</strong><span>Admin workspace</span></div>
        </div>
        <div className="admin-login-copy">
          <p className="admin-eyebrow">Secure access</p>
          <h1>Sign in to CVUp Admin</h1>
          <p>Continue with the authorized CVUp Google account.</p>
        </div>
        {message ? <p className="admin-login-error">{message}</p> : null}
        <button type="button" onClick={signInWithGoogle} disabled={submitting} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px"}}>
          <GoogleIcon />
          {submitting ? "Opening Google..." : "Continue with Google"}
        </button>
      </section>
    </main>
  );
}
