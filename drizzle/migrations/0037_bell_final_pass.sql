CREATE OR REPLACE FUNCTION public.tg_activity_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_type text; v_cap capability_key; v_title text; v_link text; v_msg text; v_group text;
  v_thing text; v_all_title text; v_all_group text; v_all_link text; v_day text;
BEGIN
  v_day := to_char(NEW.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD');

  IF NEW.outcome <> 'ok' THEN
    v_type := 'order_failed'; v_cap := 'manage_team';
    v_title := CASE NEW.outcome WHEN 'unknown' THEN 'Not sure if saved' ELSE 'Something failed' END;
  ELSIF NEW.money_direction = 'in' THEN v_type := 'money_in'; v_cap := 'see_money'; v_title := CASE WHEN NEW.amount < 0 THEN 'Payment cancelled' ELSE 'Money received' END;
  ELSIF NEW.money_direction = 'out' THEN v_type := 'money_out'; v_cap := 'see_money'; v_title := CASE WHEN NEW.amount < 0 THEN 'Supplier payment cancelled' ELSE 'Money paid out' END;
  ELSIF NEW.entity_type = 'credit_note' AND NEW.action = 'created' THEN v_type := 'credit_note'; v_cap := 'see_money'; v_title := 'Credit note issued';
  ELSIF NEW.entity_type = 'order' AND NEW.action = 'created' THEN v_type := 'order_placed'; v_cap := 'see_all_dealers'; v_title := 'New order';
  ELSIF NEW.entity_type = 'order' AND NEW.action IN ('cancelled','deleted') THEN v_type := 'order_cancelled'; v_cap := 'see_all_dealers'; v_title := 'Order ' || NEW.action;
  ELSIF NEW.entity_type = 'team' THEN v_type := 'team_update'; v_cap := 'manage_team'; v_title := 'Team access changed';
  END IF;

  v_link := CASE NEW.entity_type
    WHEN 'order' THEN CASE WHEN NEW.action = 'deleted' OR NEW.entity_id = '00000000-0000-0000-0000-000000000000'::uuid THEN '/orders' ELSE '/orders/' || NEW.entity_id END
    WHEN 'payment' THEN COALESCE('/orders/' || (NEW.metadata->>'order_id'), '/billing')
    WHEN 'credit_note' THEN '/claims' WHEN 'supplier_payment' THEN '/buying'
    WHEN 'team' THEN '/settings' ELSE '/activity' END;
  IF NEW.outcome <> 'ok' THEN v_link := '/activity'; END IF;

  -- 1) Important alerts: to others with the right access (badge counts these).
  IF v_type IS NOT NULL THEN
    v_group := v_type || ':' || CASE WHEN NEW.outcome <> 'ok' THEN NEW.entity_type || ':' || NEW.outcome || ':' ELSE '' END || NEW.user_id || ':' || v_day;
    v_msg := NEW.summary
      || CASE WHEN NEW.amount IS NOT NULL AND (v_cap = 'see_money' OR NEW.entity_type = 'order')
              THEN ' · ' || CASE WHEN NEW.amount < 0 AND NEW.money_direction IS DISTINCT FROM 'out' THEN '−' ELSE '' END || '₹' || to_char(abs(NEW.amount), 'FM99,99,99,99,990') ELSE '' END
      || CASE WHEN NEW.user_name <> '' THEN ' · by ' || NEW.user_name ELSE '' END
      || CASE WHEN NEW.outcome <> 'ok' AND NEW.metadata->>'reason' <> '' THEN ' — ' || (NEW.metadata->>'reason') ELSE '' END;

    INSERT INTO notifications (company_id, user_id, type, title, message, link, group_key, activity_id, priority)
    SELECT NEW.company_id, p.user_id, v_type, v_title, left(v_msg, 400), v_link, v_group, NEW.id, 'important'
    FROM profiles p
    WHERE p.company_id = NEW.company_id AND p.user_id <> NEW.user_id AND has_capability(p.user_id, v_cap)
      AND (NEW.outcome = 'ok' OR NOT EXISTS (
        SELECT 1 FROM notifications n WHERE n.user_id = p.user_id AND n.group_key = v_group
          AND n.created_at > now() - interval '10 minutes'))
    ON CONFLICT DO NOTHING;
  END IF;

  -- 2) Every action: quiet entry (already read) under "All activity" for money-access users,
  --    including the person who did it. Unique (user_id, activity_id) skips anyone who got an important one.
  v_thing := CASE NEW.entity_type
    WHEN 'order' THEN 'Order' WHEN 'invoice' THEN 'GST bill' WHEN 'payment' THEN 'Payment'
    WHEN 'credit_note' THEN 'Credit note' WHEN 'claim' THEN 'Return' WHEN 'purchase_bill' THEN 'Purchase bill'
    WHEN 'purchase_return' THEN 'Purchase return' WHEN 'supplier_payment' THEN 'Supplier payment'
    WHEN 'supplier' THEN 'Supplier' WHEN 'dealer' THEN 'Dealer' WHEN 'distributor' THEN 'Dealer'
    WHEN 'product' THEN 'Product' WHEN 'scheme' THEN 'Offer' WHEN 'godown' THEN 'Godown' WHEN 'warehouse' THEN 'Godown'
    WHEN 'target' THEN 'Target' WHEN 'salesperson' THEN 'Salesperson' WHEN 'stock' THEN 'Stock' WHEN 'stock_item' THEN 'Stock'
    WHEN 'shop_visit' THEN 'Shop visit' WHEN 'visit' THEN 'Shop visit' WHEN 'prospect' THEN 'New shop' WHEN 'shop_prospect' THEN 'New shop' WHEN 'team' THEN 'Team'
    WHEN 'company' THEN 'Business settings' WHEN 'tally' THEN 'Tally settings'
    ELSE initcap(replace(NEW.entity_type, '_', ' ')) END;
  v_all_title := COALESCE(v_title, v_thing || ' ' || replace(NEW.action, '_', ' '));
  v_all_link := CASE WHEN NEW.outcome <> 'ok' THEN '/activity' ELSE CASE NEW.entity_type
    WHEN 'order' THEN v_link WHEN 'payment' THEN v_link WHEN 'team' THEN '/settings'
    WHEN 'invoice' THEN COALESCE('/orders/' || (NEW.metadata->>'order_id'), '/billing')
    WHEN 'credit_note' THEN '/claims' WHEN 'claim' THEN '/claims'
    WHEN 'dealer' THEN '/distributors/' || NEW.entity_id WHEN 'salesperson' THEN '/salespersons/' || NEW.entity_id
    WHEN 'purchase_bill' THEN '/buying/bills/' || NEW.entity_id WHEN 'supplier' THEN '/buying/suppliers/' || NEW.entity_id
    WHEN 'supplier_payment' THEN '/buying' WHEN 'purchase_return' THEN '/buying'
    WHEN 'product' THEN '/stock' WHEN 'stock' THEN '/stock' WHEN 'warehouse' THEN '/stock'
    WHEN 'scheme' THEN '/schemes' WHEN 'target' THEN '/targets' WHEN 'visit' THEN '/visits' WHEN 'prospect' THEN '/visits'
    WHEN 'company' THEN '/company' ELSE '/activity' END END;
  IF NEW.action = 'deleted' AND NEW.entity_type NOT IN ('order') THEN v_all_link := '/activity'; END IF;
  v_all_group := 'all:' || NEW.entity_type || ':' || NEW.action || ':' || NEW.outcome || ':' || NEW.user_id || ':' || v_day;

  INSERT INTO notifications (company_id, user_id, type, title, message, link, group_key, activity_id, priority, read)
  SELECT NEW.company_id, p.user_id, COALESCE(v_type, 'general'), v_all_title,
    left(NEW.summary
      || CASE WHEN NEW.amount IS NOT NULL THEN ' · ' || CASE WHEN NEW.amount < 0 AND NEW.money_direction IS DISTINCT FROM 'out' THEN '−' ELSE '' END || '₹' || to_char(abs(NEW.amount), 'FM99,99,99,99,990') ELSE '' END
      || CASE WHEN p.user_id = NEW.user_id THEN ' · by You'
              WHEN NEW.user_name <> '' THEN ' · by ' || NEW.user_name ELSE '' END, 400),
    v_all_link, v_all_group, NEW.id, 'normal', true
  FROM profiles p
  WHERE p.company_id = NEW.company_id AND has_capability(p.user_id, 'see_money')
    AND (NEW.outcome = 'ok' OR NOT EXISTS (
      SELECT 1 FROM notifications n WHERE n.user_id = p.user_id AND n.group_key = v_all_group
        AND n.created_at > now() - interval '10 minutes'))
  ON CONFLICT DO NOTHING;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.tg_activity_notify() FROM PUBLIC, anon, authenticated;