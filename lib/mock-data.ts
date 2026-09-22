export type RequestStatus =
  | "NEW"
  | "WAITING_PAYMENT"
  | "PAID"
  | "IN_PROGRESS"
  | "REVIEW"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

export type CvRequestRecord = {
  id: string;
  request_code: string;
  created_at: string;
  status: RequestStatus;
  form_language: string;
  full_name: string;
  phone: string;
  email: string;
  cv_type: string;
  target_job_title: string;
  company_name?: string;
  job_url?: string;
  job_description_text?: string;
  professional_field: string;
  target_role: string;
  cv_language_count: number;
  selected_cv_languages: string[];
  has_current_cv: boolean;
  current_cv_file_name?: string;
  optional_cv_link?: string;
  tools: string[];
  spoken_languages: { language: string; level: string }[];
  has_certifications: boolean;
  certifications_text?: string;
  certifications_file_name?: string;
  certifications_link?: string;
  cv_design_preference: string;
  cv_template_file_name?: string;
  cv_template_link?: string;
  additional_information?: string;
  excluded_information?: string;
  recruitment_consent: boolean;
  final_consent: boolean;
  admin_notes?: string;
  job_description_file_name?: string;
};

export const sampleRequests: CvRequestRecord[] = [];

export function getRequestByCode(code: string) {
  return null;
}
