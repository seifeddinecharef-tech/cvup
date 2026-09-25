"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CVUP_BASE_PRICE_DZD } from "@/lib/pricing";

function SuccessContent() {
  const params = useSearchParams();
  const requestCode = params.get("request_code") || "";
  const [clientName, setClientName] = useState("");
  const sofizpayUrl = process.env.NEXT_PUBLIC_SOFIZPAY_PAYMENT_URL?.trim();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const arabicName = window.sessionStorage.getItem("cvup_last_full_name_arabic")?.trim();
      const latinName = window.sessionStorage.getItem("cvup_last_full_name")?.trim();
      setClientName(arabicName || latinName || "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const whatsappUrl = useMemo(() => {
    const message = requestCode
      ? `السلام عليكم، أريد إتمام تسديد طلب CVUp رقم ${requestCode} عبر بريدي موب.`
      : "السلام عليكم، أريد إتمام تسديد طلب CVUp عبر بريدي موب.";
    return `https://wa.me/213794851081?text=${encodeURIComponent(message)}`;
  }, [requestCode]);

  async function rememberMethod(method: "SOFIZPAY" | "BARIDIMOB_MANUAL") {
    if (!requestCode) return;
    try {
      await fetch(`/api/requests/${encodeURIComponent(requestCode)}/payment-choice`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_method: method }),
      });
    } catch {
      // Payment navigation must remain available even if method tracking fails.
    }
  }

  async function openSofizPay() {
    await rememberMethod("SOFIZPAY");
    if (sofizpayUrl) window.location.assign(sofizpayUrl);
  }

  async function openWhatsApp() {
    await rememberMethod("BARIDIMOB_MANUAL");
    window.location.assign(whatsappUrl);
  }

  return (
    <main dir="rtl" lang="ar" className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 font-[var(--font-arabic-body)] text-slate-900">
      <div className="w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-8 text-right shadow-[0_20px_70px_rgba(15,23,42,0.10)] md:p-12">
        <div className="mb-7 inline-flex rounded-full bg-amber-100 px-5 py-2 text-sm font-bold text-amber-800">
          الطلب محفوظ — في انتظار التسديد
        </div>

        <h1 className="text-4xl font-black leading-[1.25] text-slate-950 md:text-5xl">
          {clientName ? `${clientName}، اختر طريقة التسديد.` : "اختر طريقة التسديد."}
        </h1>

        <p className="mt-5 text-lg leading-8 text-slate-600">
          طلبك محفوظ{requestCode ? ` برقم ${requestCode}` : ""}. لن تبدأ معالجة السيرة الذاتية بالذكاء الاصطناعي إلا بعد تأكيد التسديد.
        </p>

        <div className="mt-8 rounded-2xl bg-slate-50 p-5">
          <span className="text-sm text-slate-500">المبلغ</span>
          <strong className="mt-1 block text-3xl">{CVUP_BASE_PRICE_DZD} دج</strong>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 p-5">
            <h2 className="text-xl font-black">الدفع عبر SofizPay</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              ادفع إلكترونيا عبر SofizPay. فتح صفحة الدفع وحده لا يعني أن العملية تم تأكيدها.
            </p>
            <button
              type="button"
              onClick={openSofizPay}
              disabled={!sofizpayUrl}
              className="mt-5 w-full rounded-full bg-slate-950 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sofizpayUrl ? "الدفع عبر SofizPay" : "SofizPay غير مهيأ حاليا"}
            </button>
          </section>

          <section className="rounded-2xl border border-slate-200 p-5">
            <h2 className="text-xl font-black">الدفع عبر بريدي موب</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              تواصل معنا عبر واتساب للحصول على معلومات بريدي موب. بعد التحقق من التسديد من طرف الإدارة، تبدأ معالجة طلبك تلقائيا.
            </p>
            <button type="button" onClick={openWhatsApp} className="mt-5 w-full rounded-full border border-slate-900 px-5 py-3 font-bold text-slate-950">
              التواصل عبر واتساب للدفع
            </button>
          </section>
        </div>

        <p className="mt-7 text-sm leading-7 text-slate-500">
          عند الدفع عبر بريدي موب يبقى الطلب في حالة انتظار إلى أن يتم التحقق من العملية وتأكيدها من لوحة الإدارة.
        </p>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
