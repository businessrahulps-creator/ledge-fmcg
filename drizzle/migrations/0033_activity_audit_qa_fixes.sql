CREATE OR REPLACE FUNCTION public.tg_audit_row()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  j jsonb; o jsonb;
  v_company uuid; v_entity uuid; v_type text; v_label text; v_action text;
  v_ref text; v_amount numeric; v_dir text; v_changed text[] := '{}';
  v_before jsonb; v_after jsonb; k text;
  noise text[] := ARRAY['updated_at','created_at','total_sold','avg_cost','outstanding_amount','total_orders','total_value','next_order_sequence','next_invoice_sequence','last_deducted_date'];
BEGIN
  IF v_uid IS NULL THEN RETURN NULL; END IF;

  IF TG_OP = 'DELETE' THEN j := to_jsonb(OLD); ELSE j := to_jsonb(NEW); END IF;
  IF TG_OP = 'UPDATE' THEN
    o := to_jsonb(OLD);
    FOR k IN SELECT jsonb_object_keys(j) LOOP
      IF NOT (k = ANY(noise)) AND (o->k) IS DISTINCT FROM (j->k) THEN
        v_changed := v_changed || k;
      END IF;
    END LOOP;
    IF array_length(v_changed,1) IS NULL THEN RETURN NULL; END IF;
    SELECT jsonb_object_agg(x, o->x), jsonb_object_agg(x, j->x) INTO v_before, v_after FROM unnest(v_changed) x;
  END IF;

  v_type := CASE TG_TABLE_NAME
    WHEN 'orders' THEN 'order' WHEN 'invoices' THEN 'invoice' WHEN 'invoice_payments' THEN 'payment'
    WHEN 'credit_notes' THEN 'credit_note' WHEN 'claims' THEN 'claim' WHEN 'purchase_bills' THEN 'purchase_bill'
    WHEN 'purchase_returns' THEN 'purchase_return' WHEN 'supplier_payments' THEN 'supplier_payment'
    WHEN 'suppliers' THEN 'supplier' WHEN 'stock_movements' THEN 'stock' WHEN 'distributors' THEN 'dealer'
    WHEN 'products' THEN 'product' WHEN 'schemes' THEN 'scheme' WHEN 'godowns' THEN 'warehouse'
    WHEN 'targets' THEN 'target' WHEN 'salespersons' THEN 'salesperson' WHEN 'shop_visits' THEN 'visit'
    WHEN 'shop_prospects' THEN 'prospect' WHEN 'companies' THEN 'company' WHEN 'tally_settings' THEN 'company'
    ELSE 'team' END;
  v_label := CASE v_type
    WHEN 'order' THEN 'Order' WHEN 'invoice' THEN 'GST bill' WHEN 'payment' THEN 'Payment received'
    WHEN 'credit_note' THEN 'Credit note' WHEN 'claim' THEN 'Return' WHEN 'purchase_bill' THEN 'Purchase bill'
    WHEN 'purchase_return' THEN 'Purchase return' WHEN 'supplier_payment' THEN 'Supplier payment'
    WHEN 'supplier' THEN 'Supplier' WHEN 'stock' THEN 'Stock' WHEN 'dealer' THEN 'Dealer'
    WHEN 'product' THEN 'Product' WHEN 'scheme' THEN 'Offer' WHEN 'warehouse' THEN 'Godown'
    WHEN 'target' THEN 'Target' WHEN 'salesperson' THEN 'Salesperson' WHEN 'visit' THEN 'Shop visit'
    WHEN 'prospect' THEN 'New shop' WHEN 'company' THEN 'Company settings'
    ELSE CASE TG_TABLE_NAME WHEN 'team_invites' THEN 'Team invite' WHEN 'user_roles' THEN 'Team role' ELSE 'Access' END END;

  v_company := CASE TG_TABLE_NAME
    WHEN 'companies' THEN (j->>'id')::uuid
    WHEN 'user_roles' THEN (SELECT company_id FROM profiles WHERE user_id = (j->>'user_id')::uuid LIMIT 1)
    WHEN 'user_capability_overrides' THEN (SELECT company_id FROM profiles WHERE user_id = (j->>'user_id')::uuid LIMIT 1)
    ELSE (j->>'company_id')::uuid END;
  IF v_company IS NULL THEN RETURN NULL; END IF;
  v_entity := COALESCE((j->>'id')::uuid, v_company);

  v_action := CASE TG_OP WHEN 'INSERT' THEN 'created' WHEN 'DELETE' THEN 'deleted' ELSE 'updated' END;
  IF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'orders' AND 'cancelled_at' = ANY(v_changed) AND j->>'cancelled_at' IS NOT NULL THEN v_action := 'cancelled';
    ELSIF TG_TABLE_NAME = 'orders' AND 'delivery_status' = ANY(v_changed) THEN
      v_action := CASE j->>'delivery_status' WHEN 'dispatched' THEN 'dispatched' WHEN 'delivered' THEN 'delivered' ELSE 'sending undone' END;
    ELSIF TG_TABLE_NAME IN ('invoice_payments','supplier_payments','purchase_bills') AND 'status' = ANY(v_changed) AND j->>'status' IN ('voided','cancelled') THEN v_action := 'cancelled';
    END IF;
  END IF;

  v_ref := COALESCE(j->>'order_number', j->>'invoice_number', j->>'credit_note_number', j->>'supplier_bill_no',
                    j->>'name', j->>'entity_name', j->>'email', j->>'role', j->>'capability', j->>'reference', '');
  IF TG_TABLE_NAME = 'stock_movements' THEN
    v_ref := COALESCE((SELECT name FROM products WHERE id = (j->>'product_id')::uuid), '') || ' ' ||
             CASE WHEN (j->>'delta')::int >= 0 THEN '+' ELSE '' END || (j->>'delta') || ' (' || COALESCE(j->>'movement_type','') || ')';
  END IF;

  -- Orders: same net value as the summary (total minus offer savings).
  v_amount := CASE WHEN TG_TABLE_NAME = 'orders' THEN (j->>'total')::numeric - COALESCE((j->>'scheme_savings')::numeric, 0)
                   ELSE COALESCE((j->>'grand_total')::numeric, (j->>'amount')::numeric, (j->>'total_claim_value')::numeric) END;
  IF TG_TABLE_NAME = 'invoice_payments' AND ((TG_OP = 'INSERT' AND j->>'status' = 'posted') OR v_action = 'cancelled') THEN
    v_dir := 'in'; IF v_action = 'cancelled' THEN v_amount := -v_amount; END IF;
  ELSIF TG_TABLE_NAME = 'supplier_payments' AND ((TG_OP = 'INSERT' AND j->>'status' = 'posted') OR v_action = 'cancelled') THEN
    v_dir := 'out'; IF v_action = 'cancelled' THEN v_amount := -v_amount; END IF;
  END IF;

  INSERT INTO activity_log (company_id, user_id, user_name, entity_type, entity_id, action, summary, metadata,
                            source, outcome, money_direction, amount, before, after, changed_fields)
  VALUES (v_company, v_uid, '', v_type, v_entity, v_action,
          left(trim(v_label || ' ' || COALESCE(v_ref,'') || ' ' || v_action), 300),
          jsonb_build_object('table', TG_TABLE_NAME,
            'distributor_id', j->>'distributor_id', 'order_id', COALESCE(j->>'order_id', j->>'source_order_id')),
          'db', 'ok', v_dir, v_amount, v_before, v_after, v_changed);
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.tg_audit_row() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.tg_activity_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_type text; v_cap capability_key; v_title text; v_link text; v_msg text;
BEGIN
  IF NEW.outcome <> 'ok' THEN
    v_type := 'order_failed'; v_cap := 'manage_team';
    v_title := CASE NEW.outcome WHEN 'unknown' THEN 'Not sure if saved' ELSE 'Something failed' END;
  ELSIF NEW.money_direction = 'in' THEN v_type := 'money_in'; v_cap := 'see_money'; v_title := CASE WHEN NEW.amount < 0 THEN 'Payment cancelled' ELSE 'Money received' END;
  ELSIF NEW.money_direction = 'out' THEN v_type := 'money_out'; v_cap := 'see_money'; v_title := CASE WHEN NEW.amount < 0 THEN 'Supplier payment cancelled' ELSE 'Money paid out' END;
  ELSIF NEW.entity_type = 'credit_note' AND NEW.action = 'created' THEN v_type := 'credit_note'; v_cap := 'see_money'; v_title := 'Credit note issued';
  ELSIF NEW.entity_type = 'order' AND NEW.action = 'created' THEN v_type := 'order_placed'; v_cap := 'see_all_dealers'; v_title := 'New order';
  ELSIF NEW.entity_type = 'order' AND NEW.action IN ('cancelled','deleted') THEN v_type := 'order_cancelled'; v_cap := 'see_all_dealers'; v_title := 'Order ' || NEW.action;
  ELSIF NEW.entity_type = 'team' THEN v_type := 'team_update'; v_cap := 'manage_team'; v_title := 'Team access changed';
  ELSE RETURN NULL; END IF;

  v_link := CASE NEW.entity_type
    WHEN 'order' THEN CASE WHEN NEW.action = 'deleted' OR NEW.entity_id = '00000000-0000-0000-0000-000000000000'::uuid THEN '/orders' ELSE '/orders/' || NEW.entity_id END
    WHEN 'payment' THEN COALESCE('/orders/' || (NEW.metadata->>'order_id'), '/billing')
    WHEN 'credit_note' THEN '/claims' WHEN 'supplier_payment' THEN '/buying'
    WHEN 'team' THEN '/settings' ELSE '/activity' END;
  v_msg := NEW.summary
    || CASE WHEN NEW.amount IS NOT NULL AND (v_cap = 'see_money' OR NEW.entity_type = 'order')
            THEN ' · ₹' || to_char(abs(NEW.amount), 'FM99,99,99,99,990') ELSE '' END
    || CASE WHEN NEW.user_name <> '' THEN ' · by ' || NEW.user_name ELSE '' END
    || CASE WHEN NEW.outcome <> 'ok' AND NEW.metadata->>'reason' <> '' THEN ' — ' || (NEW.metadata->>'reason') ELSE '' END;

  INSERT INTO notifications (company_id, user_id, type, title, message, link, group_key, activity_id)
  SELECT NEW.company_id, p.user_id, v_type, v_title, left(v_msg, 400), v_link,
         v_type || ':' || NEW.user_id || ':' || to_char(NEW.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD'), NEW.id
  FROM profiles p
  WHERE p.company_id = NEW.company_id AND p.user_id <> NEW.user_id AND has_capability(p.user_id, v_cap)
  ON CONFLICT DO NOTHING;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.tg_activity_notify() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Owners and money users view activity" ON public.activity_log;
CREATE POLICY "Owners and money users view activity" ON public.activity_log FOR SELECT TO authenticated
USING (company_id = get_company_id()
  AND (has_capability(auth.uid(),'manage_team') OR has_capability(auth.uid(),'see_money'))
  AND (has_capability(auth.uid(),'see_money')
       OR (money_direction IS NULL
           AND entity_type NOT IN ('invoice','payment','credit_note','claim','purchase_bill','purchase_return','supplier_payment','supplier'))));