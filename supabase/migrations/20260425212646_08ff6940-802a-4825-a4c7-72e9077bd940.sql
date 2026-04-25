DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.activity_log REPLICA IDENTITY FULL;