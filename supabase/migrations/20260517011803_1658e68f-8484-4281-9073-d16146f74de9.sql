ALTER TABLE public.user_capability_overrides
  ADD CONSTRAINT user_capability_overrides_user_cap_key
  UNIQUE (user_id, capability);