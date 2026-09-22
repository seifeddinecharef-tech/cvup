CREATE TABLE IF NOT EXISTS cv_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'NEW',
  form_language TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  cv_type TEXT NOT NULL,
  target_job_title TEXT,
  company_name TEXT,
  job_url TEXT,
  job_description_text TEXT,
  professional_field TEXT,
  target_role TEXT,
  cv_language_count INTEGER,
  selected_cv_languages TEXT[],
  has_current_cv BOOLEAN DEFAULT FALSE,
  current_cv_file_path TEXT,
  current_cv_file_name TEXT,
  current_cv_file_type TEXT,
  optional_cv_link TEXT,
  tools TEXT[],
  spoken_languages JSONB,
  has_certifications BOOLEAN DEFAULT FALSE,
  certifications_text TEXT,
  certifications_file_path TEXT,
  certifications_file_name TEXT,
  certifications_file_type TEXT,
  certifications_link TEXT,
  cv_design_preference TEXT,
  cv_template_file_path TEXT,
  cv_template_file_name TEXT,
  cv_template_file_type TEXT,
  cv_template_link TEXT,
  additional_information TEXT,
  excluded_information TEXT,
  recruitment_consent BOOLEAN DEFAULT FALSE,
  final_consent BOOLEAN DEFAULT FALSE,
  admin_notes TEXT,
  job_description_file_path TEXT,
  job_description_file_name TEXT,
  job_description_file_type TEXT,
  internal_status_updated_at TIMESTAMPTZ,
  raw_payload JSONB
);

CREATE INDEX IF NOT EXISTS cv_requests_created_at_idx ON cv_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS cv_requests_status_idx ON cv_requests (status);
CREATE INDEX IF NOT EXISTS cv_requests_email_idx ON cv_requests (email);

ALTER TABLE cv_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on cv_requests" ON cv_requests
FOR INSERT WITH CHECK (true);

-- Admin reads and updates should occur server-side through the service role,
-- which bypasses RLS. Public anon SELECT/UPDATE/DELETE access is intentionally disabled.
