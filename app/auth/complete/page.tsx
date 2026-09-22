"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

export default function AuthComplete() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const next = params.get("next") || "/account";
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";

    if (!accessToken || !refreshToken) {
      window.location.replace("/account/login?error=oauth");
      return;
    }

    getSupabaseBrowserClient().auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    }).then(({ error }) => {
      if (error) window.location.replace("/account/login?error=oauth");
      else window.location.replace(safeNext);
    });
  }, []);

  return <main className="grid min-h-screen place-items-center bg-[#f7f9f4] text-[#102019]"><p>Signing you in…</p></main>;
}
