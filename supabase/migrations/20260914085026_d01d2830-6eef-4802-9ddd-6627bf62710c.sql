CREATE UNIQUE INDEX IF NOT EXISTS targets_unique_entity_period
  ON public.targets (company_id, entity_type, entity_id, period_type, period_start);