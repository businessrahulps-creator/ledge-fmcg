DO $$
BEGIN
  RAISE NOTICE 'viewer role seeded with zero capabilities (by design): has_capability returns false for every key, all capability-gated write policies fail closed, read policies (company_id = get_company_id()) still pass.';
END $$;