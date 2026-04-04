
-- ============================================================
-- Ledge FMCG — Complete Production Schema
-- ============================================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('super_admin', 'sales_manager', 'accountant', 'salesperson');
CREATE TYPE public.payment_mode AS ENUM ('cash', 'bank_transfer', 'cheque', 'upi');
CREATE TYPE public.payment_status AS ENUM ('paid', 'partial', 'pending');
CREATE TYPE public.delivery_status AS ENUM ('pending', 'dispatched', 'delivered');

-- 2. TABLES

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  gstin text NOT NULL DEFAULT '',
  order_prefix text NOT NULL DEFAULT 'ORD' CHECK (char_length(order_prefix) <= 10),
  next_order_sequence integer NOT NULL DEFAULT 1 CHECK (next_order_sequence >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.distributors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text NOT NULL DEFAULT '',
  contact text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.salespersons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text NOT NULL,
  unit text NOT NULL DEFAULT 'Pack',
  base_price numeric NOT NULL DEFAULT 0 CHECK (base_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, sku)
);

CREATE TABLE public.godowns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stock_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  godown_id uuid NOT NULL REFERENCES public.godowns(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  threshold integer NOT NULL DEFAULT 0 CHECK (threshold >= 0),
  last_deducted_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, godown_id)
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  order_number text NOT NULL UNIQUE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  distributor_id uuid NOT NULL REFERENCES public.distributors(id) ON DELETE RESTRICT,
  distributor_name text NOT NULL,
  salesperson_id uuid NOT NULL REFERENCES public.salespersons(id) ON DELETE RESTRICT,
  salesperson_name text NOT NULL,
  total numeric NOT NULL DEFAULT 0 CHECK (total >= 0),
  payment_mode public.payment_mode NOT NULL DEFAULT 'cash',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  dispatch_date date,
  vehicle text NOT NULL DEFAULT '',
  driver_name text NOT NULL DEFAULT '',
  delivery_status public.delivery_status NOT NULL DEFAULT 'pending',
  dispatch_remarks text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  line_total numeric NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stock_deductions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  godown_id uuid NOT NULL REFERENCES public.godowns(id) ON DELETE RESTRICT,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  quantity_deducted integer NOT NULL CHECK (quantity_deducted > 0),
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. INDEXES
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_distributors_company_id ON public.distributors(company_id);
CREATE INDEX idx_salespersons_company_id ON public.salespersons(company_id);
CREATE INDEX idx_products_company_id ON public.products(company_id);
CREATE INDEX idx_godowns_company_id ON public.godowns(company_id);
CREATE INDEX idx_stock_items_company_id ON public.stock_items(company_id);
CREATE INDEX idx_stock_items_godown_id ON public.stock_items(godown_id);
CREATE INDEX idx_stock_items_product_id ON public.stock_items(product_id);
CREATE INDEX idx_orders_company_id ON public.orders(company_id);
CREATE INDEX idx_orders_distributor_id ON public.orders(distributor_id);
CREATE INDEX idx_orders_salesperson_id ON public.orders(salesperson_id);
CREATE INDEX idx_orders_date ON public.orders(date);
CREATE INDEX idx_order_lines_order_id ON public.order_lines(order_id);
CREATE INDEX idx_order_lines_product_id ON public.order_lines(product_id);
CREATE INDEX idx_stock_deductions_company_id ON public.stock_deductions(company_id);
CREATE INDEX idx_stock_deductions_order_id ON public.stock_deductions(order_id);

-- 4. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_distributors_updated_at BEFORE UPDATE ON public.distributors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_salespersons_updated_at BEFORE UPDATE ON public.salespersons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_godowns_updated_at BEFORE UPDATE ON public.godowns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_stock_items_updated_at BEFORE UPDATE ON public.stock_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 5. AUTH TRIGGER — Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_created();

-- 6. SECURITY DEFINER HELPERS
CREATE OR REPLACE FUNCTION public.get_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- 7. ENABLE RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salespersons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.godowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_deductions ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES

-- companies
CREATE POLICY "Users can view their own company" ON public.companies FOR SELECT TO authenticated USING (id = public.get_company_id());
CREATE POLICY "Super admins can update their company" ON public.companies FOR UPDATE TO authenticated USING (id = public.get_company_id()) WITH CHECK (id = public.get_company_id());

-- profiles
CREATE POLICY "Users can view own-company profiles" ON public.profiles FOR SELECT TO authenticated USING (company_id = public.get_company_id());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- user_roles
CREATE POLICY "Users can view own-company roles" ON public.user_roles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = user_roles.user_id AND p.company_id = public.get_company_id())
);
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- distributors
CREATE POLICY "Company members can view distributors" ON public.distributors FOR SELECT TO authenticated USING (company_id = public.get_company_id());
CREATE POLICY "Company members can insert distributors" ON public.distributors FOR INSERT TO authenticated WITH CHECK (company_id = public.get_company_id());
CREATE POLICY "Company members can update distributors" ON public.distributors FOR UPDATE TO authenticated USING (company_id = public.get_company_id()) WITH CHECK (company_id = public.get_company_id());
CREATE POLICY "Company members can delete distributors" ON public.distributors FOR DELETE TO authenticated USING (company_id = public.get_company_id());

-- salespersons
CREATE POLICY "Company members can view salespersons" ON public.salespersons FOR SELECT TO authenticated USING (company_id = public.get_company_id());
CREATE POLICY "Company members can insert salespersons" ON public.salespersons FOR INSERT TO authenticated WITH CHECK (company_id = public.get_company_id());
CREATE POLICY "Company members can update salespersons" ON public.salespersons FOR UPDATE TO authenticated USING (company_id = public.get_company_id()) WITH CHECK (company_id = public.get_company_id());
CREATE POLICY "Company members can delete salespersons" ON public.salespersons FOR DELETE TO authenticated USING (company_id = public.get_company_id());

-- products
CREATE POLICY "Company members can view products" ON public.products FOR SELECT TO authenticated USING (company_id = public.get_company_id());
CREATE POLICY "Company members can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (company_id = public.get_company_id());
CREATE POLICY "Company members can update products" ON public.products FOR UPDATE TO authenticated USING (company_id = public.get_company_id()) WITH CHECK (company_id = public.get_company_id());
CREATE POLICY "Company members can delete products" ON public.products FOR DELETE TO authenticated USING (company_id = public.get_company_id());

-- godowns
CREATE POLICY "Company members can view godowns" ON public.godowns FOR SELECT TO authenticated USING (company_id = public.get_company_id());
CREATE POLICY "Company members can insert godowns" ON public.godowns FOR INSERT TO authenticated WITH CHECK (company_id = public.get_company_id());
CREATE POLICY "Company members can update godowns" ON public.godowns FOR UPDATE TO authenticated USING (company_id = public.get_company_id()) WITH CHECK (company_id = public.get_company_id());
CREATE POLICY "Company members can delete godowns" ON public.godowns FOR DELETE TO authenticated USING (company_id = public.get_company_id());

-- stock_items
CREATE POLICY "Company members can view stock items" ON public.stock_items FOR SELECT TO authenticated USING (company_id = public.get_company_id());
CREATE POLICY "Company members can insert stock items" ON public.stock_items FOR INSERT TO authenticated WITH CHECK (company_id = public.get_company_id());
CREATE POLICY "Company members can update stock items" ON public.stock_items FOR UPDATE TO authenticated USING (company_id = public.get_company_id()) WITH CHECK (company_id = public.get_company_id());
CREATE POLICY "Company members can delete stock items" ON public.stock_items FOR DELETE TO authenticated USING (company_id = public.get_company_id());

-- orders
CREATE POLICY "Company members can view orders" ON public.orders FOR SELECT TO authenticated USING (company_id = public.get_company_id());
CREATE POLICY "Company members can insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (company_id = public.get_company_id());
CREATE POLICY "Company members can update orders" ON public.orders FOR UPDATE TO authenticated USING (company_id = public.get_company_id()) WITH CHECK (company_id = public.get_company_id());

-- order_lines
CREATE POLICY "Users can view order lines for their company" ON public.order_lines FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_lines.order_id AND o.company_id = public.get_company_id()));
CREATE POLICY "Users can insert order lines for their company" ON public.order_lines FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_lines.order_id AND o.company_id = public.get_company_id()));
CREATE POLICY "Users can update order lines for their company" ON public.order_lines FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_lines.order_id AND o.company_id = public.get_company_id())) WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_lines.order_id AND o.company_id = public.get_company_id()));
CREATE POLICY "Users can delete order lines for their company" ON public.order_lines FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_lines.order_id AND o.company_id = public.get_company_id()));

-- stock_deductions
CREATE POLICY "Company members can view stock deductions" ON public.stock_deductions FOR SELECT TO authenticated USING (company_id = public.get_company_id());
CREATE POLICY "Company members can insert stock deductions" ON public.stock_deductions FOR INSERT TO authenticated WITH CHECK (company_id = public.get_company_id());
