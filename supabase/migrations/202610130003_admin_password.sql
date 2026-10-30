begin;

-- The server derives this id from the logged-in admin; it is never accepted from
-- the form. Client roles cannot issue this permit, including logged-in admins.
create or replace function dircom_private.issue_admin_password_update(p_user_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare token uuid := gen_random_uuid();
begin
  if not exists (
    select 1 from public.profiles p
    join dircom_private.primary_administrator a on a.user_id = p.id
    where p.id = p_user_id and p.role = 'admin' and p.is_active
  ) then raise exception 'Invalid administrator'; end if;
  insert into dircom_private.password_updates values (p_user_id, token, clock_timestamp() + interval '3 minutes')
    on conflict (user_id) do update set nonce = excluded.nonce, expires_at = excluded.expires_at;
  return token;
end;
$$;
create or replace function public.dircom_issue_admin_password_update(p_user_id uuid) returns uuid
language sql security invoker set search_path = '' as $$
  select dircom_private.issue_admin_password_update(p_user_id);
$$;
revoke all on function dircom_private.issue_admin_password_update(uuid),
  public.dircom_issue_admin_password_update(uuid) from public, anon, authenticated;
grant execute on function dircom_private.issue_admin_password_update(uuid),
  public.dircom_issue_admin_password_update(uuid) to service_role;

commit;
