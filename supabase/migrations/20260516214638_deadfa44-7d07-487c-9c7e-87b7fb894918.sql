ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_self_selected text,
  ADD COLUMN IF NOT EXISTS team_size text;