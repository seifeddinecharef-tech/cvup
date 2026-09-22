"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const requestCode = searchParams.get("request_code");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
          Request received
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Your request has been received.</h1>

        {requestCode ? (
          <div className="mt-6 rounded-2xl bg-slate-100 p-4">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Request code</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{requestCode}</p>
          </div>
        ) : null}

        <p className="mt-6 text-base leading-7 text-slate-600">
          The CVUp team will review the information you provided and continue with the next steps as needed.
        </p>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Next step: you will be contacted through WhatsApp or email to confirm the details and move forward.
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
