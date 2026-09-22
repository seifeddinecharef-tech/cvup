"use client";

import { Suspense, useEffect, useState } from "react";

function SuccessContent() {
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const arabicName = window.sessionStorage.getItem("cvup_last_full_name_arabic")?.trim();
      const latinName = window.sessionStorage.getItem("cvup_last_full_name")?.trim();
      setClientName(arabicName || latinName || "");
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main dir="rtl" lang="ar" className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 font-[var(--font-arabic-body)] text-slate-900">
      <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-8 text-right shadow-[0_20px_70px_rgba(15,23,42,0.10)] md:p-12">
        <div className="mb-8 inline-flex rounded-full bg-emerald-100 px-5 py-2 text-sm font-bold text-emerald-700">
          تم استلام الطلب
        </div>

        <h1 className="text-4xl font-black leading-[1.25] text-slate-950 md:text-5xl">
          {clientName ? `${clientName}، تم استلام طلبك بنجاح.` : "تم استلام طلبك بنجاح."}
        </h1>

        <div className="mt-8 space-y-5 text-xl leading-10 text-slate-700">
          <p>
            سيتواصل معك فريق CVUp عبر واتساب لتأكيد الطلب وتأكيد الدفع قبل بدء المعالجة.
          </p>
          <p>
            بعد تأكيد الطلب والدفع، ستحصل على سيرتك الذاتية المهنية قبل مرور 24 ساعة.
          </p>
        </div>

        <a
          href="https://wa.me/213794851081"
          target="_blank"
          rel="noreferrer"
          className="mt-9 inline-flex min-h-14 items-center justify-center rounded-full bg-slate-950 px-8 text-base font-black text-white no-underline shadow-lg shadow-slate-900/15"
        >
          التواصل عبر واتساب
        </a>
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
