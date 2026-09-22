import { NextResponse } from "next/server";
import { AiProviderHttpError, getAiProvider } from "@/lib/ai-provider";
import { buildCandidateDossier, saveAnalysis } from "@/lib/analysis-data";
import { getAdminRequestByCode } from "@/lib/admin-data";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ requestCode: string }> }) {
  const { requestCode } = await params;
  const supabase = getSupabaseServerClient();
  const request = await getAdminRequestByCode(requestCode);
  if (!request?.id) return NextResponse.json({ success: false, error: "Request not found." }, { status: 404 });

  let provider;
  try {
    provider = getAiProvider();
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "AI provider is not configured." }, { status: 503 });
  }

  await supabase.from("cv_requests").update({ status: "ANALYZING", internal_status_updated_at: new Date().toISOString() }).eq("id", request.id);
  try {
    const analysis = await provider.analyzeCandidate(await buildCandidateDossier(request));
    const saved = await saveAnalysis(request.id, analysis, process.env.CVUP_AI_MODEL || "configured-provider");
    const status = analysis.internal_quality.ready_for_generation ? "READY_TO_GENERATE" : "NEEDS_REVIEW";
    await supabase.from("cv_requests").update({ status, internal_status_updated_at: new Date().toISOString() }).eq("id", request.id);
    return NextResponse.json({ success: true, status, analysis: saved.analysis });
  } catch (error) {
    await supabase.from("cv_requests").update({ status: "ERROR", internal_status_updated_at: new Date().toISOString() }).eq("id", request.id);
    if (error instanceof AiProviderHttpError) {
      const safeError = {
        status: error.status,
        type: error.type,
        code: error.code,
        message: error.providerMessage,
        request_id: error.requestId,
      };
      console.error(JSON.stringify({ stage: "ai_provider_error", ...safeError }));
      return NextResponse.json({ success: false, error: safeError }, { status: 503 });
    }
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Analysis failed." }, { status: 503 });
  }
}