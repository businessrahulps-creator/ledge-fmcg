CREATE TABLE public.error_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  company_id uuid NULL,
  user_id uuid NULL,
  severity text NOT NULL DEFAULT 'error',
  source text NOT NULL,
  message text NOT NULL DEFAULT '',
  stack text NOT NULL DEFAULT '',
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_error_log_company_created ON public.error_log (company_id, created_at DESC);
CREATE INDEX idx_error_log_source ON public.error_log (source);

ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can insert (broken-state users still need to log)
CREATE POLICY "Authenticated users can insert error logs"
ON public.error_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Only super admins of the matching company can view
CREATE POLICY "Super admins can view company error logs"
ON public.error_log
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  AND (company_id IS NULL OR company_id = get_company_id())
);

-- Only super admins can update (mark resolved)
CREATE POLICY "Super admins can update company error logs"
ON public.error_log
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role)
  AND (company_id IS NULL OR company_id = get_company_id())
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role)
  AND (company_id IS NULL OR company_id = get_company_id())
);

COMMENT ON TABLE public.error_log IS 'Sentry-style in-app error log. Recommend periodic cleanup of resolved rows older than 90 days.';