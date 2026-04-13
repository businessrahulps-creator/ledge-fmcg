
-- Profiles → auth.users
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User roles → auth.users
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Invoices
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD CONSTRAINT invoices_source_order_id_fkey FOREIGN KEY (source_order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

-- Claims
ALTER TABLE public.claims
  ADD CONSTRAINT claims_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD CONSTRAINT claims_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT,
  ADD CONSTRAINT claims_distributor_id_fkey FOREIGN KEY (distributor_id) REFERENCES public.distributors(id) ON DELETE RESTRICT;

-- Claim lines → products
ALTER TABLE public.claim_lines
  ADD CONSTRAINT claim_lines_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;

-- Targets
ALTER TABLE public.targets
  ADD CONSTRAINT targets_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- Notifications
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Activity log
ALTER TABLE public.activity_log
  ADD CONSTRAINT activity_log_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD CONSTRAINT activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Secondary sales
ALTER TABLE public.secondary_sales
  ADD CONSTRAINT secondary_sales_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD CONSTRAINT secondary_sales_distributor_id_fkey FOREIGN KEY (distributor_id) REFERENCES public.distributors(id) ON DELETE RESTRICT,
  ADD CONSTRAINT secondary_sales_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
