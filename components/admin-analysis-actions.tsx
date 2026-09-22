"use client";

import { useState } from "react";

export function AdminAnalysisActions({ requestCode }: { requestCode: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function analyze() {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/requests/${encodeURIComponent(requestCode)}/analyze`, { method: "POST" });
      const result = (await response.json()) as { success?: boolean; status?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "Analysis failed.");
      setMessage(`Analysis saved: ${result.status}`);
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Analysis failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={analyze} disabled={isSubmitting} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {isSubmitting ? "Analyzing..." : "Analyze Request"}
      </button>
      {message ? <p className="max-w-sm text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}