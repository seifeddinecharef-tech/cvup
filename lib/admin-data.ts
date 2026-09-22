import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase";

export type CvRequestRow = {
  id?: string;
  request_code?: string;
  created_at?: string;
  status?: string;
  payment_method?: string | null;
  payment_status?: string | null;
  payment_reference?: string | null;
  payment_notes?: string | null;
  paid_at?: string | null;
  form_language?: string;
  full_name?: string;
  phone?: string;
  email?: string;
  cv_type?: string;
  target_job_title?: string;
  company_name?: string;
  job_url?: string;
  job_description_text?: string;
  professional_field?: string;
  target_role?: string;
  cv_language_count?: number | null;
  selected_cv_languages?: string[] | null;
  has_current_cv?: boolean | null;
  current_cv_file_path?: string | null;
  current_cv_file_name?: string | null;
  current_cv_file_type?: string | null;
  optional_cv_link?: string | null;
  tools?: string[] | null;
  spoken_languages?: unknown;
  has_certifications?: boolean | null;
  certifications_text?: string | null;
  certifications_file_path?: string | null;
  certifications_file_name?: string | null;
  certifications_file_type?: string | null;
  certifications_link?: string | null;
  cv_design_preference?: string | null;
  cv_template_file_path?: string | null;
  cv_template_file_name?: string | null;
  cv_template_file_type?: string | null;
  cv_template_link?: string | null;
  additional_information?: string | null;
  excluded_information?: string | null;
  recruitment_consent?: boolean | null;
  final_consent?: boolean | null;
  admin_notes?: string | null;
  job_description_file_path?: string | null;
  job_description_file_name?: string | null;
  job_description_file_type?: string | null;
  internal_status_updated_at?: string | null;
  supporting_materials?: unknown;
  raw_payload?: unknown;
  [key: string]: unknown;
};

function normalizeEnvValue(value: string | undefined) {
  return value?.replace(/^\uFEFF/, "").trim();
}

export async function getAdminRequests(): Promise<CvRequestRow[]> {
  noStore();
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Add the server-only key to enable admin requests.");
  }

  const { data, error } = await supabase
    .from("cv_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      JSON.stringify(
        {
          projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          keyLength: normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)?.length ?? 0,
          keyPrefix: normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)?.slice(0, 6) ?? "",
          query: "SELECT * FROM public.cv_requests ORDER BY created_at DESC",
          error,
        },
        null,
        2
      )
    );
    throw new Error(error.message || "Failed to load CVUp requests.");
  }

  return data ?? [];
}

export async function getAdminRequestByCode(requestCode: string): Promise<CvRequestRow | null> {
  noStore();
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Add the server-only key to enable admin requests.");
  }

  const { data, error } = await supabase
    .from("cv_requests")
    .select("*")
    .eq("request_code", requestCode)
    .maybeSingle();

  if (error) {
    console.error(
      JSON.stringify(
        {
          projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          keyLength: normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)?.length ?? 0,
          keyPrefix: normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)?.slice(0, 6) ?? "",
          query: `SELECT * FROM public.cv_requests WHERE request_code = '${requestCode}'`,
          error,
        },
        null,
        2
      )
    );
    throw new Error(error.message || "Failed to load request details.");
  }

  return data ?? null;
}
