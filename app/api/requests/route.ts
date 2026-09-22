import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { assertRequestSubmissionTokenConfigured, createRequestSubmissionToken } from "@/lib/request-submission-token";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function generateRequestCode(): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const randomPart = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");

  return `CVUP-${today}-${randomPart}`;
}

export async function POST(request: Request) {
  try {
    assertRequestSubmissionTokenConfigured();

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > 300_000) {
      return NextResponse.json({ success: false, error: "Request payload is too large." }, { status: 413 });
    }

    const payload = await request.json();

    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ success: false, error: "Invalid payload." }, { status: 400 });
    }

    if (typeof payload.website === "string" && payload.website.trim()) {
      return NextResponse.json({ success: false, error: "Invalid payload." }, { status: 400 });
    }

    if (!payload.full_name || !payload.phone || !payload.email || !payload.cv_type || !payload.form_language) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    if (JSON.stringify(payload).length > 300_000) {
      return NextResponse.json({ success: false, error: "Request payload is too large." }, { status: 413 });
    }

    const fullName = String(payload.full_name).trim();
    const phone = String(payload.phone).trim();
    const email = String(payload.email).trim().toLowerCase();
    const formLanguage = String(payload.form_language);
    const cvType = String(payload.cv_type);

    if (fullName.length < 2 || fullName.length > 160) {
      return NextResponse.json({ success: false, error: "Invalid full name." }, { status: 400 });
    }

    if (phone.length < 6 || phone.length > 32) {
      return NextResponse.json({ success: false, error: "Invalid WhatsApp number." }, { status: 400 });
    }

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email address." }, { status: 400 });
    }

    if (!["ar", "fr", "en"].includes(formLanguage)) {
      return NextResponse.json({ success: false, error: "Invalid form language." }, { status: 400 });
    }

    if (!["General CV", "CV targeted to a specific job"].includes(cvType)) {
      return NextResponse.json({ success: false, error: "Invalid CV type." }, { status: 400 });
    }

    if (payload.final_consent !== true) {
      return NextResponse.json({ success: false, error: "Final consent is required." }, { status: 400 });
    }

    const requestCode = generateRequestCode();
    const rawPayload = { ...payload };
    delete rawPayload.website;

    const supportingMaterials = Array.isArray(payload.supporting_materials)
      ? payload.supporting_materials
          .filter((item: unknown): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
          .slice(0, 20)
          .map((item: Record<string, unknown>) => {
            const questionKey = typeof item.question_key === "string"
              ? item.question_key.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80)
              : "";
            let link: string | null = null;
            if (typeof item.link === "string" && item.link.trim()) {
              try {
                const url = new URL(item.link.trim());
                if (url.protocol === "http:" || url.protocol === "https:") link = url.toString().slice(0, 2000);
              } catch {
                link = null;
              }
            }
            return { question_key: questionKey, link };
          })
          .filter((item: { question_key: string; link: string | null }) => item.question_key && item.link)
      : [];

    const insertPayload = {
      request_code: requestCode,
      status: "NEW",
      form_language: formLanguage,
      full_name: fullName,
      phone,
      email,
      cv_type: cvType,
      target_job_title: payload.target_job_title ?? null,
      company_name: payload.company_name ?? null,
      job_url: payload.job_url ?? null,
      job_description_text: payload.job_description_text ?? null,
      professional_field: payload.professional_field ?? null,
      target_role: payload.target_role ?? null,
      cv_language_count: Number(payload.cv_language_count ?? 1),
      selected_cv_languages: Array.isArray(payload.selected_cv_languages) ? payload.selected_cv_languages : [],
      has_current_cv: payload.has_current_cv === true || payload.has_current_cv === "Yes",
      current_cv_file_path: null,
      current_cv_file_name: null,
      current_cv_file_type: null,
      optional_cv_link: payload.optional_cv_link ?? null,
      tools: Array.isArray(payload.tools) ? payload.tools : [],
      spoken_languages: payload.spoken_languages ?? null,
      has_certifications: payload.has_certifications === true || payload.has_certifications === "Yes",
      certifications_text: payload.certifications_text ?? null,
      certifications_file_path: null,
      certifications_file_name: null,
      certifications_file_type: null,
      certifications_link: payload.certifications_link ?? null,
      cv_design_preference: payload.cv_design_preference ?? null,
      cv_template_file_path: null,
      cv_template_file_name: null,
      cv_template_file_type: null,
      cv_template_link: payload.cv_template_link ?? null,
      additional_information: payload.additional_information ?? null,
      excluded_information: payload.excluded_information ?? null,
      recruitment_consent: payload.recruitment_consent === true || payload.recruitment_consent === "Yes",
      final_consent: payload.final_consent === true,
      admin_notes: null,
      job_description_file_path: null,
      job_description_file_name: null,
      job_description_file_type: null,
      supporting_materials: supportingMaterials,
      raw_payload: rawPayload,
    };

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("cv_requests")
      .insert([insertPayload])
      .select("id, request_code, created_at")
      .single();

    if (error || !data || !data.request_code) {
      console.error(
        JSON.stringify({
          stage: "insert_error",
          request_code: requestCode,
          code: error?.code ?? "unknown",
          message: error?.message ?? "Insert failed without data.",
        })
      );
      return NextResponse.json({ success: false, error: "Request could not be created." }, { status: 500 });
    }

    const submissionToken = await createRequestSubmissionToken(String(data.id), String(data.request_code));

    return NextResponse.json(
      {
        success: true,
        id: data.id,
        request_code: data.request_code,
        submission_token: submissionToken,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        stage: "submission_error",
        code: error instanceof Error ? error.name : "unknown",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    );
    return NextResponse.json({ success: false, error: "Unexpected server error." }, { status: 500 });
  }
}
