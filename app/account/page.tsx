"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

type Req = {
  request_code: string;
  created_at: string;
  status: string;
  payment_status: string | null;
  payment_method: string | null;
  target_job_title: string | null;
  company_name?: string | null;
  cv_type: string;
};

type Language = "ar" | "fr" | "en";

const labels = {
  en: {
    workspace: "Client workspace",
    welcome: "Welcome back",
    subtitle: "Your profile is saved and can be reused for future CV requests.",
    newCv: "Create a new CV",
    editPrevious: "Edit a previous request",
    editProfile: "Edit profile",
    requests: "My CV requests",
    requestsSub: "Track your requests and complete the next step when needed.",
    total: "Total requests",
    progress: "In progress",
    ready: "Ready",
    chooseTitle: "Edit a previous request",
    chooseSub: "Choose the request you want to review and update.",
    close: "Close",
    select: "Review & edit",
    locked: "This request can no longer be edited because processing has started.",
    empty: "You don't have any previous requests yet.",
    signOut: "Sign out",
    payment: "Waiting for payment",
    files: "Action required",
    processing: "In progress",
    done: "Ready",
    notePayment: "Payment is required before we can start your CV.",
    noteProcessing: "Your CV is currently being prepared.",
    noteDone: "Your CV is ready.",
    details: "Review request",
    pay: "Complete payment",
  },
  fr: {
    workspace: "Espace client",
    welcome: "Bon retour",
    subtitle: "Votre profil est enregistré et peut être réutilisé pour vos prochaines demandes.",
    newCv: "Créer un nouveau CV",
    editPrevious: "Modifier une demande précédente",
    editProfile: "Modifier le profil",
    requests: "Mes demandes de CV",
    requestsSub: "Suivez vos demandes et complétez l’étape suivante si nécessaire.",
    total: "Demandes",
    progress: "En cours",
    ready: "Prêtes",
    chooseTitle: "Modifier une demande précédente",
    chooseSub: "Choisissez la demande que vous souhaitez vérifier et modifier.",
    close: "Fermer",
    select: "Vérifier et modifier",
    locked: "Cette demande ne peut plus être modifiée car son traitement a commencé.",
    empty: "Vous n’avez encore aucune demande.",
    signOut: "Se déconnecter",
    payment: "Paiement requis",
    files: "Action requise",
    processing: "En cours",
    done: "Prêt",
    notePayment: "Le paiement est requis avant le démarrage de votre CV.",
    noteProcessing: "Votre CV est en cours de préparation.",
    noteDone: "Votre CV est prêt.",
    details: "Voir la demande",
    pay: "Payer",
  },
  ar: {
    workspace: "مساحة العميل",
    welcome: "مرحبًا بعودتك",
    subtitle: "معلوماتك محفوظة ويمكن إعادة استخدامها في طلبات السيرة الذاتية القادمة.",
    newCv: "إنشاء سيرة ذاتية جديدة",
    editPrevious: "تعديل طلب سابق",
    editProfile: "تعديل الملف الشخصي",
    requests: "طلبات السيرة الذاتية",
    requestsSub: "تابع طلباتك وأكمل الخطوة التالية عند الحاجة.",
    total: "إجمالي الطلبات",
    progress: "قيد المعالجة",
    ready: "جاهزة",
    chooseTitle: "تعديل طلب سابق",
    chooseSub: "اختر الطلب الذي تريد مراجعته وتعديل بياناته.",
    close: "إغلاق",
    select: "مراجعة وتعديل",
    locked: "لا يمكن تعديل هذا الطلب بعد بدء المعالجة.",
    empty: "لا توجد لديك طلبات سابقة بعد.",
    signOut: "تسجيل الخروج",
    payment: "في انتظار الدفع",
    files: "إجراء مطلوب",
    processing: "قيد المعالجة",
    done: "جاهز",
    notePayment: "يجب إتمام الدفع قبل بدء معالجة السيرة الذاتية.",
    noteProcessing: "يتم حاليًا إعداد سيرتك الذاتية.",
    noteDone: "سيرتك الذاتية جاهزة.",
    details: "مراجعة الطلب",
    pay: "إكمال الدفع",
  },
} as const;

function isEditable(request: Req) {
  if (request.payment_status === "PAID") return false;
  return !["IN_PROGRESS", "READY", "DELIVERED", "COMPLETED"].includes(request.status);
}

function requestState(request: Req, language: Language) {
  const t = labels[language];
  if (request.status === "READY" || request.status === "DELIVERED" || request.status === "COMPLETED") {
    return { badge: t.done, note: t.noteDone, kind: "ready" };
  }
  if (request.payment_status === "PAID" || request.status === "IN_PROGRESS") {
    return { badge: t.processing, note: t.noteProcessing, kind: "progress" };
  }
  return { badge: t.payment, note: t.notePayment, kind: "payment" };
}

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>("en");
  const [showPrevious, setShowPrevious] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("cvup_language");
    if (stored === "ar" || stored === "fr" || stored === "en") setLanguage(stored);
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
          .select("request_code,created_at,status,payment_status,payment_method,target_job_title,company_name,cv_type")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      setProfile(p);
      setRequests((r || []) as Req[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!showPrevious) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowPrevious(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showPrevious]);

  async function logout() {
    await getSupabaseBrowserClient().auth.signOut();
    location.href = "/";
  }

  const t = labels[language];
  const rtl = language === "ar";
  const stats = useMemo(() => ({
    total: requests.length,
    progress: requests.filter((request) => request.payment_status === "PAID" && !["READY", "DELIVERED", "COMPLETED"].includes(request.status)).length,
    ready: requests.filter((request) => ["READY", "DELIVERED", "COMPLETED"].includes(request.status)).length,
  }), [requests]);

  if (loading) {
    return <main className="min-h-screen bg-[#f7f9f4] p-6"><div className="mx-auto max-w-6xl animate-pulse space-y-4"><div className="h-16 rounded-3xl bg-white" /><div className="h-56 rounded-3xl bg-white" /></div></main>;
  }

  return (
    <main dir={rtl ? "rtl" : "ltr"} className="min-h-screen bg-[#f7f9f4] p-4 text-[#102019] md:p-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-[#dfe7df] py-4">
          <Link href="/" className="flex items-center gap-3 font-bold">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-xs text-white">CV</span>
            <span className="text-xl">CVUp</span>
          </Link>
          <div className="flex items-center gap-2">
            <select
              aria-label="Language"
              value={language}
              onChange={(event) => {
                const value = event.target.value as Language;
                setLanguage(value);
                window.localStorage.setItem("cvup_language", value);
              }}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
            >
              <option value="ar">العربية</option>
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
            <button onClick={logout} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium">{t.signOut}</button>
          </div>
        </header>

        <section className="mt-6 rounded-[28px] border border-[#dfe7df] bg-white p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#628000]">{t.workspace}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{t.welcome}</h1>
          <p dir="ltr" className={`mt-1 font-semibold ${rtl ? "text-right" : "text-left"}`}>{profile?.full_name_latin || user?.email}</p>
          <p className="mt-4 text-slate-500">{t.subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/?new=1#form" className="rounded-full bg-[#102019] px-6 py-3 text-sm font-bold text-white">{t.newCv}</Link>
            <button type="button" onClick={() => setShowPrevious(true)} className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold transition hover:bg-slate-50">{t.editPrevious}</button>
            <Link href="/account/profile" className="rounded-full px-4 py-3 text-sm font-bold text-[#0d5f46] hover:bg-slate-50">{t.editProfile}</Link>
          </div>
        </section>

        <section className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            [t.total, stats.total],
            [t.progress, stats.progress],
            [t.ready, stats.ready],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-[#dfe7df] bg-white px-5 py-4">
              <span className="text-sm text-slate-500">{label}</span>
              <strong className="mt-1 block text-2xl">{value}</strong>
            </div>
          ))}
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{t.requests}</h2>
              <p className="mt-1 text-sm text-slate-500">{t.requestsSub}</p>
            </div>
            <Link href="/?new=1#form" className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold">{t.newCv}</Link>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {requests.length ? requests.map((request) => {
              const state = requestState(request, language);
              return (
                <article key={request.request_code} className="rounded-[22px] border border-[#dfe7df] bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold">{request.target_job_title || request.cv_type}</h3>
                      {request.company_name ? <p className="mt-1 text-sm text-slate-500">{request.company_name}</p> : null}
                      <p dir="ltr" className={`mt-1 text-xs text-slate-400 ${rtl ? "text-right" : "text-left"}`}>#{request.request_code}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${state.kind === "payment" ? "bg-amber-50 text-amber-800" : state.kind === "ready" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{state.badge}</span>
                  </div>
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-sm leading-6 text-slate-600">{state.note}</p>
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      {isEditable(request) ? (
                        <Link href={`/?edit=${encodeURIComponent(request.request_code)}#form`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold">{t.details}</Link>
                      ) : null}
                      {request.payment_status !== "PAID" ? (
                        <Link href={`/success?request_code=${encodeURIComponent(request.request_code)}`} className="rounded-full bg-[#102019] px-4 py-2 text-sm font-bold text-white">{t.pay}</Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            }) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 lg:col-span-2">{t.empty}</div>}
          </div>
        </section>
      </div>

      {showPrevious ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-[2px] md:items-center md:p-6" onMouseDown={(event) => { if (event.currentTarget === event.target) setShowPrevious(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="previous-request-title" className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-t-[28px] bg-white shadow-2xl md:rounded-[28px]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <h2 id="previous-request-title" className="text-2xl font-bold">{t.chooseTitle}</h2>
                <p className="mt-1 text-sm text-slate-500">{t.chooseSub}</p>
              </div>
              <button type="button" onClick={() => setShowPrevious(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-xl" aria-label={t.close}>×</button>
            </div>
            <div className="max-h-[65vh] space-y-3 overflow-y-auto p-4 md:p-6">
              {requests.length ? requests.map((request) => {
                const editable = isEditable(request);
                const state = requestState(request, language);
                return (
                  <article key={request.request_code} className="rounded-2xl border border-slate-200 p-4 transition hover:border-slate-400">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold">{request.target_job_title || request.cv_type}</h3>
                        {request.company_name ? <p className="text-sm text-slate-500">{request.company_name}</p> : null}
                        <p dir="ltr" className={`mt-1 text-xs text-slate-400 ${rtl ? "text-right" : "text-left"}`}>{request.request_code}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{state.badge}</span>
                    </div>
                    {editable ? (
                      <Link href={`/?edit=${encodeURIComponent(request.request_code)}#form`} className="mt-4 inline-flex rounded-full bg-[#102019] px-5 py-2.5 text-sm font-bold text-white">{t.select}</Link>
                    ) : (
                      <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">{t.locked}</p>
                    )}
                  </article>
                );
              }) : <p className="p-6 text-center text-slate-500">{t.empty}</p>}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
