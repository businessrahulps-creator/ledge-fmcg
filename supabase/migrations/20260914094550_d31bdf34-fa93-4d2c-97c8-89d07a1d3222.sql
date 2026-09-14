-- Stamp identity server-side so clients cannot spoof audit authorship
create or replace function public.tg_activity_log_stamp_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.user_id := auth.uid();
  new.company_id := coalesce(public.get_company_id(), new.company_id);
  new.user_name := coalesce(
    nullif((select p.full_name from public.profiles p where p.user_id = auth.uid() limit 1), ''),
    nullif((select p.email from public.profiles p where p.user_id = auth.uid() limit 1), ''),
    ''
  );
  new.created_at := now();
  return new;
end;
$$;

revoke all on function public.tg_activity_log_stamp_identity() from anon, authenticated;

drop trigger if exists activity_log_stamp_identity on public.activity_log;
create trigger activity_log_stamp_identity
before insert on public.activity_log
for each row execute function public.tg_activity_log_stamp_identity();

-- Block updates/deletes of audit rows (no policies exist = denied, keep explicit)
drop policy if exists "Company members can insert activity log" on public.activity_log;
create policy "Members insert own activity log"
on public.activity_log
for insert
to authenticated
with check (company_id = public.get_company_id() and user_id = auth.uid());
