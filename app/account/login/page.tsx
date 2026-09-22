"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

function GoogleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.55l3.35-2.62Z"/><path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"/></svg>;
}

export default function Login() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/account");
      else setLoading(false);
    });
  }, []);

  async function continueWithGoogle() {
    setMessage("");
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/account`,
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return <main className="grid min-h-screen place-items-center bg-[#f7f9f4] p-5 text-[#102019]">
    <section className="w-full max-w-sm rounded-[28px] bg-white p-7 shadow-sm">
      <Link href="/" className="text-2xl font-bold">CVUp</Link>
      <h1 className="mt-8 text-3xl font-bold">Welcome</h1>
      <p className="mt-2 text-slate-500">Sign in once to save your information and reuse it for future CVs.</p>
      <button type="button" disabled={loading} onClick={continueWithGoogle} className="mt-7 flex w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-5 py-3.5 font-medium transition hover:bg-slate-50 active:scale-[.99] disabled:cursor-wait disabled:opacity-60">
        <GoogleIcon /> {loading ? "Checking…" : "Continue with Google"}
      </button>
      {message && <p role="alert" className="mt-4 text-sm text-red-600">{message}</p>}
      <p className="mt-6 text-center text-xs leading-5 text-slate-400">Your session stays saved on this browser until you sign out or it expires.</p>
    </section>
  </main>;
}
