
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (company_id = get_company_id());

CREATE POLICY "Users can insert company notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (company_id = get_company_id());

CREATE POLICY "Users can update company notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (company_id = get_company_id())
  WITH CHECK (company_id = get_company_id());

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
