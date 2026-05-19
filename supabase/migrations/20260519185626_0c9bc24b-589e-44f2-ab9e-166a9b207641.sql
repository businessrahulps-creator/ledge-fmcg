
-- Signal acknowledgements: lets a workspace ack/snooze/assign/resolve any /command signal.
CREATE TABLE public.signal_acknowledgements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL,
  signal_key    text NOT NULL,
  snoozed_until timestamptz,
  assigned_to   uuid,
  resolved_at   timestamptz,
  actor         uuid NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_signal_acks_company_key ON public.signal_acknowledgements(company_id, signal_key);
CREATE INDEX idx_signal_acks_assigned ON public.signal_acknowledgements(assigned_to) WHERE assigned_to IS NOT NULL;

ALTER TABLE public.signal_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view signal acks"
  ON public.signal_acknowledgements FOR SELECT
  TO authenticated
  USING (company_id = public.get_company_id());

CREATE POLICY "Company members can insert signal acks"
  ON public.signal_acknowledgements FOR INSERT
  TO authenticated
  WITH CHECK (company_id = public.get_company_id() AND actor = auth.uid());

CREATE POLICY "Company members can update signal acks"
  ON public.signal_acknowledgements FOR UPDATE
  TO authenticated
  USING (company_id = public.get_company_id())
  WITH CHECK (company_id = public.get_company_id());

CREATE POLICY "Company members can delete signal acks"
  ON public.signal_acknowledgements FOR DELETE
  TO authenticated
  USING (company_id = public.get_company_id());

CREATE TRIGGER trg_signal_acks_updated_at
  BEFORE UPDATE ON public.signal_acknowledgements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.signal_acknowledgements;

-- Saved views for /command: per-user saved filter combos, optionally pinned.
CREATE TABLE public.command_saved_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL,
  user_id     uuid NOT NULL,
  name        text NOT NULL,
  params      jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_pinned   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_views_user ON public.command_saved_views(user_id);

ALTER TABLE public.command_saved_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved views"
  ON public.command_saved_views FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND company_id = public.get_company_id());

CREATE POLICY "Users can insert own saved views"
  ON public.command_saved_views FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND company_id = public.get_company_id());

CREATE POLICY "Users can update own saved views"
  ON public.command_saved_views FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND company_id = public.get_company_id())
  WITH CHECK (user_id = auth.uid() AND company_id = public.get_company_id());

CREATE POLICY "Users can delete own saved views"
  ON public.command_saved_views FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND company_id = public.get_company_id());

CREATE TRIGGER trg_saved_views_updated_at
  BEFORE UPDATE ON public.command_saved_views
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
