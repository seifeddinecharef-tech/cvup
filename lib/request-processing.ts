import { getSupabaseServerClient } from "@/lib/supabase";
import { buildCandidateDossier, getAnalysis, saveAnalysis } from "@/lib/analysis-data";
import { getAiProvider } from "@/lib/ai-provider";
import type { CvRequestRow } from "@/lib/admin-data";

export type ProcessingStartResult = {
  started: boolean;
  alreadyProcessed: boolean;
  analysisStatus?: string;
};

export async function startRequestProcessing(requestCode: string): Promise<ProcessingStartResult> {
  const supabase = getSupabaseServerClient();
  const { data: request, error } = await supabase
    .from("cv_requests")
    .select("*")
    .eq("request_code", requestCode)
    .maybeSingle();

  if (error || !request) throw new Error(error?.message || "Request not found.");
  if (request.payment_status !== "PAID") throw new Error("Payment must be confirmed before processing.");

  const existing = await getAnalysis(String(request.id));
  if (existing) {
    return { started: false, alreadyProcessed: true, analysisStatus: existing.status };
  }

  await supabase
    .from("cv_requests")
    .update({ status: "IN_PROGRESS", internal_status_updated_at: new Date().toISOString() })
    .eq("id", request.id);

  const dossier = await buildCandidateDossier(request as CvRequestRow);
  const analysis = await getAiProvider().analyzeCandidate(dossier);
  const stored = await saveAnalysis(String(request.id), analysis, "openai");

  return {
    started: true,
    alreadyProcessed: false,
    analysisStatus: stored.status,
  };
}
