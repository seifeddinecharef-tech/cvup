"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

type Req = {
  request_code: string;
  created_at: string;
  status: string;
  payment_status: string | null;
  payment_method: string | null;
  target_job_title: string | null;
  cv_type: string;
};

function clientState(request: Req) {
  if (request.payment_status !== "PAID") {
    return {
      badge: request.payment_status === "PENDING" ? "في انتظار التسديد" : "غير مدفوع",
      note: request.payment_method === "BARIDIMOB_MANUAL"
        ? "تم تسجيل طلبك، ونحن في انتظار تأكيد التسديد عبر بريدي موب."
        : "لم يتم إرسال الطلب للمعالجة بعد. أكمل التسديد للمتابعة.",
    };
  }
  if (request.status === "READY" || request.status === "DELIVERED") {
    return { badge: "جاهز", note: "تم تأكيد التسديد والسيرة الذاتية جاهزة." };
  }
  return { badge: "قيد المعالجة", note: "تم تأكيد التسديد وبدأت معالجة طلبك." };
}

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const s = getSupabaseBrowserClient();
      const { data: { user } } = await s.auth.getUser();
      if (!user) {
        location.href = "/account/login";
        return;
      }
      setUser(user);
      const [{ data: p }, { data: r }] = await Promise.all([
        s.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        s.from("cv_requests")
          .select("request_code,created_at,status,payment_status,payment_method,target_job_title,cv_type")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      setProfile(p);
      setRequests((r || []) as Req[]);
      setLoading(false);
    })();
  }, []);

  async function logout() {
    await getSupabaseBrowserClient().auth.signOut();
    location.href = "/";
  }

  if (loading) return <main className="min-h-screen p-8">Loading…</main>;

  return (
    <main className="min-h-screen bg-[#f7f9f4] p-6 text-[#102019]">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between py-5">
          <Link href="/" className="text-2xl font-bold">CVUp</Link>
          <button onClick={logout} className="rounded-full border px-5 py-2">Sign out</button>
        </header>

        <section className="rounded-[28px] bg-white p-7 shadow-sm">
          <p className="text-sm uppercase tracking-widest text-lime-600">Client workspace</p>
          <h1 className="mt-2 text-4xl font-bold">Welcome {profile?.full_name_latin || user?.email}</h1>
          <p className="mt-3 text-slate-600">Your saved information can be reused and updated for every new CV request.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/?new=profile#form" className="rounded-full bg-[#102019] px-6 py-3 text-white">+ Create a new CV</Link>
            <Link href="/account/profile" className="rounded-full border px-6 py-3">Edit my information</Link>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] bg-white p-7">
          <h2 className="text-2xl font-bold">My CV requests</h2>
          <div className="mt-4 grid gap-4">
            {requests.length ? requests.map((request) => {
              const state = clientState(request);
              return (
                <article key={request.request_code} className="rounded-2xl border p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <strong className="text-lg">{request.target_job_title || request.cv_type}</strong>
                      <p className="mt-1 text-sm text-slate-500">{new Date(request.created_at).toLocaleDateString()} · {request.request_code}</p>
                    </div>
                    <span className="rounded-full border px-3 py-1 text-sm font-semibold">{state.badge}</span>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">{state.note}</p>
                  {request.payment_status !== "PAID" ? (
                    <Link href={`/success?request_code=${encodeURIComponent(request.request_code)}`} className="mt-4 inline-flex rounded-full bg-[#102019] px-5 py-2.5 text-sm font-semibold text-white">
                      إكمال التسديد
                    </Link>
                  ) : null}
                </article>
              );
            }) : <p className="text-slate-500">No requests linked to this account yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
