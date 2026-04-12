
-- Create activity_log table
CREATE TABLE public.activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT '',
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  summary text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "Company members can view activity log"
ON public.activity_log
FOR SELECT
TO authenticated
USING (company_id = get_company_id());

-- INSERT policy
CREATE POLICY "Company members can insert activity log"
ON public.activity_log
FOR INSERT
TO authenticated
WITH CHECK (company_id = get_company_id());

-- Indexes
CREATE INDEX idx_activity_log_entity ON public.activity_log (company_id, entity_type, entity_id, created_at DESC);
CREATE INDEX idx_activity_log_feed ON public.activity_log (company_id, created_at DESC);
