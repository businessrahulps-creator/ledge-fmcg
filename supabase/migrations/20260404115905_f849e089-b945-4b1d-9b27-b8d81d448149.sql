
-- 1. INSERT policy on companies for authenticated users
CREATE POLICY "Authenticated users can create a company"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (true);

-- 2. INSERT policy on profiles so users can update their own profile (company_id link)
-- (The trigger creates the row, but we need UPDATE to set company_id)
-- Already has update policy, but let's add INSERT for edge cases
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 3. INSERT policy on user_roles for self-assignment during signup
CREATE POLICY "Users can insert their own role during signup"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 4. Atomic order number function
CREATE OR REPLACE FUNCTION public.get_next_order_number(target_company_id uuid)
RETURNS TABLE(prefix text, seq int)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE companies
  SET next_order_sequence = next_order_sequence + 1
  WHERE id = target_company_id
  RETURNING order_prefix, next_order_sequence - 1;
$$;

-- 5. Seed company data function
CREATE OR REPLACE FUNCTION public.seed_company_data(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d1 uuid := gen_random_uuid(); d2 uuid := gen_random_uuid(); d3 uuid := gen_random_uuid();
  d4 uuid := gen_random_uuid(); d5 uuid := gen_random_uuid(); d6 uuid := gen_random_uuid();
  d7 uuid := gen_random_uuid();
  s1 uuid := gen_random_uuid(); s2 uuid := gen_random_uuid();
  s3 uuid := gen_random_uuid(); s4 uuid := gen_random_uuid();
  p1 uuid := gen_random_uuid(); p2 uuid := gen_random_uuid(); p3 uuid := gen_random_uuid();
  p4 uuid := gen_random_uuid(); p5 uuid := gen_random_uuid(); p6 uuid := gen_random_uuid();
  p7 uuid := gen_random_uuid(); p8 uuid := gen_random_uuid();
  g1 uuid := gen_random_uuid(); g2 uuid := gen_random_uuid(); g3 uuid := gen_random_uuid();
  o1 uuid := gen_random_uuid(); o2 uuid := gen_random_uuid(); o3 uuid := gen_random_uuid();
  o4 uuid := gen_random_uuid(); o5 uuid := gen_random_uuid(); o6 uuid := gen_random_uuid();
  o7 uuid := gen_random_uuid(); o8 uuid := gen_random_uuid();
BEGIN
  -- Distributors
  INSERT INTO distributors (id, company_id, name, location, contact) VALUES
    (d1, p_company_id, 'Sharma Traders', 'Delhi', '+91 98100 12345'),
    (d2, p_company_id, 'Patel Distributors', 'Ahmedabad', '+91 97120 67890'),
    (d3, p_company_id, 'Gupta & Sons', 'Lucknow', '+91 94150 11223'),
    (d4, p_company_id, 'Reddy Agencies', 'Hyderabad', '+91 99490 44556'),
    (d5, p_company_id, 'Singh Supply Co.', 'Chandigarh', '+91 98760 77889'),
    (d6, p_company_id, 'Nair Enterprises', 'Kochi', '+91 94470 33445'),
    (d7, p_company_id, 'Das Trading', 'Kolkata', '+91 98300 55667');

  -- Salespersons
  INSERT INTO salespersons (id, company_id, name, phone, email, region) VALUES
    (s1, p_company_id, 'Rajesh Kumar', '+91 98100 55555', 'rajesh@ledge.in', 'North'),
    (s2, p_company_id, 'Amit Shah', '+91 97120 66666', 'amit@ledge.in', 'West'),
    (s3, p_company_id, 'Priya Verma', '+91 94150 77777', 'priya@ledge.in', 'Central'),
    (s4, p_company_id, 'Deepak Joshi', '+91 99490 88888', 'deepak@ledge.in', 'South');

  -- Products
  INSERT INTO products (id, company_id, name, sku, unit, base_price) VALUES
    (p1, p_company_id, 'Premium Basmati Rice 5kg', 'RIC-BAS-5K', 'Pack', 450),
    (p2, p_company_id, 'Sunflower Oil 1L', 'OIL-SUN-1L', 'Bottle', 180),
    (p3, p_company_id, 'Wheat Flour 10kg', 'FLR-WHT-10', 'Bag', 380),
    (p4, p_company_id, 'Sugar 5kg', 'SUG-WHT-5K', 'Pack', 240),
    (p5, p_company_id, 'Toor Dal 1kg', 'DAL-TOR-1K', 'Pack', 160),
    (p6, p_company_id, 'Tea Powder 500g', 'TEA-PRM-500', 'Pack', 320),
    (p7, p_company_id, 'Washing Powder 1kg', 'WSH-PWD-1K', 'Pack', 95),
    (p8, p_company_id, 'Bath Soap 100g (Pack of 4)', 'SOP-BTH-4P', 'Pack', 140);

  -- Godowns
  INSERT INTO godowns (id, company_id, name, address, is_active) VALUES
    (g1, p_company_id, 'Main Warehouse — Thrissur', 'Industrial Area, Thrissur, Kerala 680001', true),
    (g2, p_company_id, 'North Hub — Delhi', 'Okhla Industrial Estate, Delhi 110020', true),
    (g3, p_company_id, 'West Depot — Ahmedabad', 'Naroda GIDC, Ahmedabad, Gujarat 382330', true);

  -- Stock Items
  INSERT INTO stock_items (company_id, product_id, godown_id, quantity, threshold, last_deducted_date) VALUES
    (p_company_id, p1, g1, 420, 50, '2026-03-31'),
    (p_company_id, p2, g1, 280, 80, '2026-03-30'),
    (p_company_id, p3, g1, 35, 40, '2026-03-29'),
    (p_company_id, p4, g1, 190, 60, '2026-03-28'),
    (p_company_id, p5, g1, 520, 100, '2026-03-31'),
    (p_company_id, p6, g1, 15, 30, '2026-03-27'),
    (p_company_id, p7, g1, 340, 80, '2026-03-29'),
    (p_company_id, p8, g1, 72, 60, '2026-03-28'),
    (p_company_id, p1, g2, 180, 50, '2026-03-31'),
    (p_company_id, p2, g2, 95, 80, '2026-03-30'),
    (p_company_id, p3, g2, 220, 40, '2026-03-28'),
    (p_company_id, p5, g2, 45, 50, '2026-03-31'),
    (p_company_id, p7, g2, 500, 80, '2026-03-30'),
    (p_company_id, p2, g3, 160, 80, '2026-03-29'),
    (p_company_id, p4, g3, 310, 60, '2026-03-27'),
    (p_company_id, p6, g3, 88, 30, '2026-03-30'),
    (p_company_id, p8, g3, 25, 60, '2026-03-28'),
    (p_company_id, p1, g3, 0, 50, '2026-03-25');

  -- Orders
  INSERT INTO orders (id, company_id, order_number, date, distributor_id, distributor_name, salesperson_id, salesperson_name, total, payment_mode, payment_status, dispatch_date, vehicle, driver_name, delivery_status, dispatch_remarks) VALUES
    (o1, p_company_id, 'ORD-2026-0001', '2026-03-31', d1, 'Sharma Traders', s1, 'Rajesh Kumar', 40500, 'bank_transfer', 'paid', '2026-03-31', 'MH-01-AB-1234', 'Sunil', 'delivered', ''),
    (o2, p_company_id, 'ORD-2026-0002', '2026-03-30', d2, 'Patel Distributors', s2, 'Amit Shah', 64000, 'upi', 'partial', '2026-03-31', 'GJ-05-CD-5678', 'Mahesh', 'dispatched', 'Partial delivery expected'),
    (o3, p_company_id, 'ORD-2026-0003', '2026-03-29', d3, 'Gupta & Sons', s3, 'Priya Verma', 64000, 'cheque', 'pending', NULL, '', '', 'pending', 'Awaiting payment confirmation'),
    (o4, p_company_id, 'ORD-2026-0004', '2026-03-28', d4, 'Reddy Agencies', s1, 'Rajesh Kumar', 56500, 'cash', 'paid', '2026-03-29', 'TS-08-EF-9012', 'Ravi', 'delivered', ''),
    (o5, p_company_id, 'ORD-2026-0005', '2026-03-28', d5, 'Singh Supply Co.', s2, 'Amit Shah', 26300, 'upi', 'paid', '2026-03-29', 'PB-02-GH-3456', 'Harpreet', 'delivered', ''),
    (o6, p_company_id, 'ORD-2026-0006', '2026-03-27', d1, 'Sharma Traders', s3, 'Priya Verma', 51000, 'bank_transfer', 'partial', '2026-03-28', 'DL-03-IJ-7890', 'Vikram', 'dispatched', 'Second batch pending'),
    (o7, p_company_id, 'ORD-2026-0007', '2026-03-27', d6, 'Nair Enterprises', s1, 'Rajesh Kumar', 15200, 'cash', 'paid', '2026-03-27', 'KL-07-KL-1234', 'Anoop', 'delivered', ''),
    (o8, p_company_id, 'ORD-2026-0008', '2026-03-26', d7, 'Das Trading', s2, 'Amit Shah', 51000, 'cheque', 'pending', NULL, '', '', 'pending', 'Payment pending');

  -- Order Lines
  INSERT INTO order_lines (order_id, product_id, product_name, quantity, unit_price, line_total) VALUES
    (o1, p1, 'Premium Basmati Rice 5kg', 50, 450, 22500),
    (o1, p2, 'Sunflower Oil 1L', 100, 180, 18000),
    (o2, p3, 'Wheat Flour 10kg', 80, 380, 30400),
    (o2, p4, 'Sugar 5kg', 60, 240, 14400),
    (o2, p5, 'Toor Dal 1kg', 120, 160, 19200),
    (o3, p6, 'Tea Powder 500g', 200, 320, 64000),
    (o4, p7, 'Washing Powder 1kg', 300, 95, 28500),
    (o4, p8, 'Bath Soap 100g (Pack of 4)', 200, 140, 28000),
    (o5, p1, 'Premium Basmati Rice 5kg', 30, 450, 13500),
    (o5, p5, 'Toor Dal 1kg', 80, 160, 12800),
    (o6, p2, 'Sunflower Oil 1L', 150, 180, 27000),
    (o6, p4, 'Sugar 5kg', 100, 240, 24000),
    (o7, p3, 'Wheat Flour 10kg', 40, 380, 15200),
    (o8, p6, 'Tea Powder 500g', 100, 320, 32000),
    (o8, p7, 'Washing Powder 1kg', 200, 95, 19000);

  -- Update company sequence
  UPDATE companies SET next_order_sequence = 9 WHERE id = p_company_id;
END;
$$;
