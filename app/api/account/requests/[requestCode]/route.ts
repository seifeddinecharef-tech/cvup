import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseServerClient } from "@/lib/supabase";
import { createRequestSubmissionToken } from "@/lib/request-submission-token";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const editableStatuses = new Set(["NEW", "DRAFT", "PENDING"]);

async function getAuthenticatedUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!supabaseUrl || !publishableKey) return null;

  const cookieStore = await cookies();
  const authClient = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  });
  const { data: { user } } = await authClient.auth.getUser();
  return user ?? null;
}

function isEditableRequest(request: Record<string, unknown>) {
  if (request.payment_status === "PAID") return false;
  const status = String(request.status || "NEW");
  return editableStatuses.has(status) || !["IN_PROGRESS", "READY", "DELIVERED", "COMPLETED"].includes(status);
}

function safeArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export async function GET(_request: Request, context: { params: Promise<{ requestCode: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { requestCode } = await context.params;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("cv_requests")
    .select("*")
    .eq("request_code", requestCode)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  const editable = isEditableRequest(data as Record<string, unknown>);
  const submissionToken = editable
    ? await createRequestSubmissionToken(String(data.id), String(data.request_code))
    : null;

  return NextResponse.json({
    request: data,
    editable,
    submission_token: submissionToken,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request, context: { params: Promise<{ requestCode: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { requestCode } = await context.params;
  const body = await request.json();
  const form = body?.form;

  if (!form || typeof form !== "object") {
    return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data: existing, error: readError } = await supabase
    .from("cv_requests")
    .select("*")
    .eq("request_code", requestCode)
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError || !existing) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  if (!isEditableRequest(existing as Record<string, unknown>)) {
    return NextResponse.json({ error: "This request can no longer be edited." }, { status: 409 });
  }

  const cvType = String(form.cv_type || existing.cv_type || "General CV");
  if (!["General CV", "CV targeted to a specific job"].includes(cvType)) {
    return NextResponse.json({ error: "Invalid CV type." }, { status: 400 });
  }

  const languageCount = Number(form.cv_language_count ?? existing.cv_language_count ?? 1);
  if (![1, 2, 3].includes(languageCount)) {
    return NextResponse.json({ error: "Invalid CV language count." }, { status: 400 });
  }

  const selectedLanguages = safeArray(form.selected_cv_languages).map(String).slice(0, 3);
  const currentRaw = existing.raw_payload && typeof existing.raw_payload === "object" ? existing.raw_payload : {};
  const mergedRaw = {
    ...currentRaw,
    ...form,
    job_description_file: undefined,
    current_cv_file: undefined,
    certifications_file: undefined,
    cv_template_file: undefined,
  };

  const updatePayload = {
    form_language: String(form.form_language || existing.form_language || "fr"),
    full_name: String(form.full_name || existing.full_name || "").trim(),
    phone: String(form.phone || existing.phone || "").trim(),
    email: String(form.email || existing.email || "").trim().toLowerCase(),
    cv_type: cvType,
    target_job_title: cvType === "General CV" ? null : String(form.target_job_title || "").trim() || null,
    company_name: cvType === "General CV" ? null : String(form.company_name || "").trim() || null,
    job_url: cvType === "General CV" ? null : String(form.job_url || "").trim() || null,
    job_description_text: cvType === "General CV" ? null : String(form.job_description_text || "").trim() || null,
    professional_field: String(form.professional_field || existing.professional_field || "").trim() || null,
    target_role: String(form.target_role || existing.target_role || "").trim() || null,
    cv_language_count: languageCount,
    selected_cv_languages: selectedLanguages,
    has_current_cv: form.has_current_cv === true || form.has_current_cv === "Yes",
    optional_cv_link: String(form.optional_cv_link || "").trim() || null,
    tools: safeArray(form.tools).map(String),
    spoken_languages: form.spoken_languages ?? existing.spoken_languages,
    has_certifications: form.has_certifications === true || form.has_certifications === "Yes",
    certifications_text: String(form.certifications_text || "").trim() || null,
    certifications_link: String(form.certifications_link || "").trim() || null,
    cv_design_preference: String(form.cv_design_preference || "").trim() || null,
    cv_template_link: String(form.cv_template_link || "").trim() || null,
    additional_information: String(form.additional_information || "").trim() || null,
    excluded_information: String(form.excluded_information || "").trim() || null,
    recruitment_consent: form.recruitment_consent === true || form.recruitment_consent === "Yes",
    final_consent: form.final_consent === true,
    raw_payload: mergedRaw,
  };

  if (!updatePayload.full_name || !updatePayload.email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("cv_requests")
    .update(updatePayload)
    .eq("id", existing.id)
    .eq("user_id", user.id)
    .select("id,request_code,status,payment_status,cv_type,cv_language_count,selected_cv_languages")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "The request could not be updated." }, { status: 500 });
  }

  const submissionToken = await createRequestSubmissionToken(String(existing.id), String(existing.request_code));
  return NextResponse.json({
    success: true,
    request: updated,
    submission_token: submissionToken,
  }, { headers: { "Cache-Control": "no-store" } });
}
