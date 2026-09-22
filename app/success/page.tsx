"use client";

import { Suspense, useEffect, useState } from "react";

function SuccessContent() {
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setClientName(window.sessionStorage.getItem("cvup_last_full_name")?.trim() || "");
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
          تم استلام الطلب
        </div>
        <h1 className="text-3xl font-bold text-slate-900">
          {clientName ? `${clientName}، تم استلام طلبك بنجاح.` : "تم استلام طلبك بنجاح."}
        </h1>

        <p className="mt-6 text-base leading-7 text-slate-600">
          سيتواصل معك فريق CVUp عبر واتساب لتأكيد الطلب وتأكيد الدفع قبل بدء المعالجة.
        </p>
        <p className="mt-4 text-base leading-7 text-slate-600">
          بعد تأكيد الطلب والدفع، ستحصل على سيرتك الذاتية المهنية قبل مرور 24 ساعة.
        </p>

        <a
          href="https://wa.me/213794851081"
          target="_blank"
          rel="noreferrer"
          className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-bold text-white no-underline"
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
