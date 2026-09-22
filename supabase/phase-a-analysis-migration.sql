CREATE TABLE IF NOT EXISTS cv_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES cv_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('READY_TO_GENERATE', 'NEEDS_REVIEW')),
  analysis JSONB NOT NULL,
  provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cv_analyses_status_idx ON cv_analyses (status);
ALTER TABLE cv_analyses ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES cv_requests(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  document_kind TEXT NOT NULL CHECK (document_kind IN ('CV', 'COVER_LETTER')),
  format TEXT NOT NULL CHECK (format IN ('DOCX', 'PDF')),
  storage_path TEXT NOT NULL UNIQUE,
  content_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS generated_documents_request_idx ON generated_documents (request_id);
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public)
VALUES ('cvup-generated', 'cvup-generated', false)
ON CONFLICT (id) DO UPDATE SET public = false;