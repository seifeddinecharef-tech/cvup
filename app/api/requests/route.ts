import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { assertRequestSubmissionTokenConfigured, createRequestSubmissionToken } from "@/lib/request-submission-token";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function generateRequestCode(): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";

  for (let i = 0; i < 6; i += 1) {
    randomPart += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return `CVUP-${today}-${randomPart}`;
}

export async function POST(request: Request) {
  try {
    assertRequestSubmissionTokenConfigured();
    const payload = await request.json();

    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ success: false, error: "Invalid payload." }, { status: 400 });
    }

    if (!payload.full_name || !payload.phone || !payload.email || !payload.cv_type || !payload.form_language) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    if (payload.final_consent !== true) {
      return NextResponse.json({ success: false, error: "Final consent is required." }, { status: 400 });
    }

    const requestCode = generateRequestCode();
    const insertPayload = {
      request_code: requestCode,
      status: "NEW",
      form_language: String(payload.form_language),
      full_name: String(payload.full_name),
      phone: String(payload.phone),
      email: String(payload.email),
      cv_type: String(payload.cv_type),
      target_job_title: payload.target_job_title ?? null,
      company_name: payload.company_name ?? null,
      job_url: payload.job_url ?? null,
      job_description_text: payload.job_description_text ?? null,
      professional_field: payload.professional_field ?? null,
      target_role: payload.target_role ?? null,
      cv_language_count: Number(payload.cv_language_count ?? 1),
      selected_cv_languages: Array.isArray(payload.selected_cv_languages) ? payload.selected_cv_languages : [],
      has_current_cv: payload.has_current_cv === true || payload.has_current_cv === "Yes",
      current_cv_file_path: payload.current_cv_file_path ?? null,
      current_cv_file_name: payload.current_cv_file_name ?? null,
      current_cv_file_type: payload.current_cv_file_type ?? null,
      optional_cv_link: payload.optional_cv_link ?? null,
      tools: Array.isArray(payload.tools) ? payload.tools : [],
      spoken_languages: payload.spoken_languages ?? null,
      has_certifications: payload.has_certifications === true || payload.has_certifications === "Yes",
      certifications_text: payload.certifications_text ?? null,
      certifications_file_path: payload.certifications_file_path ?? null,
      certifications_file_name: payload.certifications_file_name ?? null,
      certifications_file_type: payload.certifications_file_type ?? null,
      certifications_link: payload.certifications_link ?? null,
      cv_design_preference: payload.cv_design_preference ?? null,
      cv_template_file_path: payload.cv_template_file_path ?? null,
      cv_template_file_name: payload.cv_template_file_name ?? null,
      cv_template_file_type: payload.cv_template_file_type ?? null,
      cv_template_link: payload.cv_template_link ?? null,
      additional_information: payload.additional_information ?? null,
      excluded_information: payload.excluded_information ?? null,
      recruitment_consent: payload.recruitment_consent === true || payload.recruitment_consent === "Yes",
      final_consent: payload.final_consent === true,
      admin_notes: null,
      job_description_file_path: payload.job_description_file_path ?? null,
      job_description_file_name: payload.job_description_file_name ?? null,
      job_description_file_type: payload.job_description_file_type ?? null,
      supporting_materials: Array.isArray(payload.supporting_materials) ? payload.supporting_materials : [],
      raw_payload: payload,
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
