ALTER TABLE public.cv_requests
  ADD COLUMN IF NOT EXISTS supporting_materials JSONB NOT NULL DEFAULT '[]'::jsonb;
