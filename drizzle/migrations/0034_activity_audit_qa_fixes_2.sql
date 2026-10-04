CREATE OR REPLACE FUNCTION public.log_failed_attempt(
  p_entity_type text, p_action text, p_summary text, p_outcome text, p_reason text,
  p_entity_id uuid DEFAULT NULL, p_amount numeric DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company uuid := get_company_id();
BEGIN
  IF auth.uid() IS NULL OR v_company IS NULL THEN RETURN; END IF;
  IF p_outcome NOT IN ('failed','unknown') THEN RAISE EXCEPTION 'Invalid outcome'; END IF;
  -- Only the save types the app tracks; anything else is ignored.
  IF coalesce(p_entity_type,'') NOT IN ('order','payment','claim','purchase_bill','supplier_payment','other') THEN RETURN; END IF;
  IF p_amount IS NOT NULL AND (p_amount < 0 OR p_amount > 1000000000) THEN p_amount := NULL; END IF;
  IF (SELECT count(*) FROM activity_log WHERE user_id = auth.uid() AND source = 'client'
        AND outcome <> 'ok' AND created_at > now() - interval '1 minute') >= 30 THEN RETURN; END IF;
  INSERT INTO activity_log (company_id, user_id, user_name, entity_type, entity_id, action, summary, metadata,
                            source, outcome, amount)
  VALUES (v_company, auth.uid(), '', p_entity_type,
          coalesce(p_entity_id, '00000000-0000-0000-0000-000000000000'::uuid),
          left(coalesce(p_action,''),40), left(coalesce(p_summary,''),300),
          jsonb_build_object('reason', left(coalesce(p_reason,''),300)),
          'client', p_outcome, p_amount);
END $$;
REVOKE ALL ON FUNCTION public.log_failed_attempt(text,text,text,text,text,uuid,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_failed_attempt(text,text,text,text,text,uuid,numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.tg_activity_notify()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_type text; v_cap capability_key; v_title text; v_link text; v_msg text; v_group text;
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

  v_group := v_type || ':' || NEW.user_id || ':' || to_char(NEW.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD');

  v_link := CASE NEW.entity_type
    WHEN 'order' THEN CASE WHEN NEW.action = 'deleted' OR NEW.entity_id = '00000000-0000-0000-0000-000000000000'::uuid THEN '/orders' ELSE '/orders/' || NEW.entity_id END
    WHEN 'payment' THEN COALESCE('/orders/' || (NEW.metadata->>'order_id'), '/billing')
    WHEN 'credit_note' THEN '/claims' WHEN 'supplier_payment' THEN '/buying'
    WHEN 'team' THEN '/settings' ELSE '/activity' END;
  IF NEW.outcome <> 'ok' THEN v_link := '/activity'; END IF;
  v_msg := NEW.summary
    || CASE WHEN NEW.amount IS NOT NULL AND (v_cap = 'see_money' OR NEW.entity_type = 'order')
            THEN ' · ₹' || to_char(abs(NEW.amount), 'FM99,99,99,99,990') ELSE '' END
    || CASE WHEN NEW.user_name <> '' THEN ' · by ' || NEW.user_name ELSE '' END
    || CASE WHEN NEW.outcome <> 'ok' AND NEW.metadata->>'reason' <> '' THEN ' — ' || (NEW.metadata->>'reason') ELSE '' END;

  INSERT INTO notifications (company_id, user_id, type, title, message, link, group_key, activity_id)
  SELECT NEW.company_id, p.user_id, v_type, v_title, left(v_msg, 400), v_link, v_group, NEW.id
  FROM profiles p
  WHERE p.company_id = NEW.company_id AND p.user_id <> NEW.user_id AND has_capability(p.user_id, v_cap)
    -- Failures: at most one alert per person per 10 minutes, so repeated errors can't flood the bell.
    AND (NEW.outcome = 'ok' OR NOT EXISTS (
      SELECT 1 FROM notifications n WHERE n.user_id = p.user_id AND n.group_key = v_group
        AND n.created_at > now() - interval '10 minutes'))
  ON CONFLICT DO NOTHING;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.tg_activity_notify() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.activity_summary(p_from date, p_to date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c uuid := get_company_id(); m boolean; r jsonb;
BEGIN
  IF c IS NULL OR NOT (has_capability(auth.uid(),'manage_team') OR has_capability(auth.uid(),'see_money')) THEN
    RAISE EXCEPTION 'You don''t have permission to see this';
  END IF;
  m := has_capability(auth.uid(),'see_money');
  SELECT jsonb_build_object(
    'orders_made', (SELECT count(*) FROM orders WHERE company_id = c AND date BETWEEN p_from AND p_to),
    'orders_cancelled', (SELECT count(*) FROM orders WHERE company_id = c AND cancelled_at IS NOT NULL AND (cancelled_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN p_from AND p_to),
    'orders_value', CASE WHEN m THEN (SELECT coalesce(sum(total - scheme_savings),0) FROM orders WHERE company_id = c AND date BETWEEN p_from AND p_to AND cancelled_at IS NULL) END,
    'failed', (SELECT count(*) FROM activity_log WHERE company_id = c AND outcome = 'failed' AND (created_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN p_from AND p_to),
    'unsure', (SELECT count(*) FROM activity_log WHERE company_id = c AND outcome = 'unknown' AND (created_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN p_from AND p_to),
    'money_in', CASE WHEN m THEN (SELECT coalesce(sum(amount),0) FROM invoice_payments WHERE company_id = c AND status = 'posted' AND paid_on BETWEEN p_from AND p_to) END,
    'money_out', CASE WHEN m THEN (SELECT coalesce(sum(amount),0) FROM supplier_payments WHERE company_id = c AND status = 'posted' AND paid_on BETWEEN p_from AND p_to) END,
    'credit_given', CASE WHEN m THEN (SELECT coalesce(sum(grand_total),0) FROM credit_notes WHERE company_id = c AND note_date BETWEEN p_from AND p_to) END,
    'changes', (SELECT count(*) FROM activity_log WHERE company_id = c AND (created_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN p_from AND p_to)
  ) INTO r;
  RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.activity_summary(date,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activity_summary(date,date) TO authenticated;