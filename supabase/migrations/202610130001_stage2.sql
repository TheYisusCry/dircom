begin;

-- Abort on a pre-existing profiles table. Never overwrite an unrelated application's data.
create schema dircom_private;
revoke all on schema dircom_private from public, anon, authenticated;
grant usage on schema dircom_private to authenticated, service_role;
alter default privileges in schema dircom_private revoke execute on functions from public;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username = lower(btrim(username)) and username ~ '^[a-z][a-z0-9._-]{2,31}$'),
  first_name text not null check (length(btrim(first_name)) between 1 and 60),
  last_name text not null check (length(btrim(last_name)) between 1 and 60),
  job_title text check (job_title is null or length(job_title) <= 100),
  birthday_day smallint,
  birthday_month smallint,
  avatar_path text,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint complete_birthday check ((birthday_day is null and birthday_month is null) or
    (birthday_day is not null and birthday_month is not null and birthday_month between 1 and 12 and birthday_day between 1 and
      case when birthday_month = 2 then 29 when birthday_month in (4,6,9,11) then 30 else 31 end)),
  constraint owned_avatar_path check (avatar_path is null or
    (avatar_path like id::text || '/%' and avatar_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'))
);
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select (id, first_name, last_name, job_title, birthday_day, birthday_month, avatar_path) on public.profiles to authenticated;
grant all on public.profiles to service_role;

create table dircom_private.account_security (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  valid_after timestamptz not null default '-infinity'
);
create table dircom_private.primary_administrator (
  singleton boolean primary key default true check (singleton),
  user_id uuid unique not null references public.profiles(id)
);
create table dircom_private.password_updates (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  nonce uuid not null,
  expires_at timestamptz not null
);
create table dircom_private.login_budgets (
  subject text primary key check (length(subject) <= 100),
  window_started_at timestamptz not null,
  attempts integer not null
);
revoke all on all tables in schema dircom_private from public, anon, authenticated;
grant all on all tables in schema dircom_private to service_role;

-- Reads the current profile without recursive RLS. Also checks the live Auth session,
-- so signed JWTs from revoked, deactivated or password-reset sessions cannot read data.
create function dircom_private.is_active_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    join dircom_private.account_security a on a.user_id = p.id
    join auth.sessions s on s.user_id = p.id
    where p.id = auth.uid() and p.is_active
      and s.id::text = auth.jwt()->>'session_id'
      and s.created_at >= a.valid_after
      and (s.not_after is null or s.not_after > now())
  );
$$;
revoke all on function dircom_private.is_active_member() from public, anon;
grant execute on function dircom_private.is_active_member() to authenticated;
create policy dircom_active_directory on public.profiles for select to authenticated
  using (is_active and dircom_private.is_active_member());

create view public.employee_directory with (security_invoker = true) as
  select id, first_name, last_name, job_title, birthday_day, birthday_month, avatar_path
  from public.profiles;
revoke all on public.employee_directory from public, anon;
grant select on public.employee_directory to authenticated;

create function dircom_private.my_profile() returns setof public.profiles
language sql stable security definer set search_path = '' as $$
  select p.* from public.profiles p where p.id = auth.uid() and dircom_private.is_active_member();
$$;
grant execute on function dircom_private.my_profile() to authenticated;
create function public.dircom_my_profile() returns setof public.profiles
language sql stable security invoker set search_path = '' as $$ select * from dircom_private.my_profile(); $$;
revoke all on function public.dircom_my_profile() from public, anon;
grant execute on function public.dircom_my_profile() to authenticated;

create function dircom_private.guard_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if exists (select 1 from dircom_private.primary_administrator where user_id = old.id) then
      raise exception 'The primary administrator is protected';
    end if;
    return old;
  end if;
  if new.id <> old.id or new.username <> old.username or new.role <> old.role then
    raise exception 'Identity, username and role are immutable';
  end if;
  if not new.is_active and exists (select 1 from dircom_private.primary_administrator where user_id = old.id) then
    raise exception 'The primary administrator is protected';
  end if;
  if old.is_active is distinct from new.is_active then
    update dircom_private.account_security set valid_after = clock_timestamp() where user_id = old.id;
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
create trigger dircom_guard_profile before update or delete on public.profiles
  for each row execute function dircom_private.guard_profile();

-- Auth's admin createUser writes app_metadata AFTER inserting auth.users, within
-- the SAME transaction. A metadata UPDATE trigger creates the profile atomically.
-- Public signup must also be disabled in the Supabase dashboard.
create function dircom_private.profile_from_auth() returns trigger
language plpgsql security definer set search_path = '' as $$
declare payload jsonb; account_role text;
begin
  payload := new.raw_app_meta_data->'dircom_profile';
  if payload is null then return new; end if;
  if exists (select 1 from public.profiles where id = new.id) then
    raise exception 'Profiles cannot be replaced through Auth metadata';
  end if;
  if new.email is null or new.email !~ '^[0-9a-f]{32}@auth\.dircom\.invalid$' then
    raise exception 'Invalid technical identity';
  end if;
  account_role := payload->>'role';
  if account_role not in ('admin', 'employee') or account_role is null then raise exception 'Invalid role'; end if;
  if account_role = 'admin' then
    perform pg_advisory_xact_lock(172946, 2);
    if exists (select 1 from public.profiles where role = 'admin') then raise exception 'Administrator already exists'; end if;
  end if;
  insert into public.profiles (id, username, first_name, last_name, job_title, birthday_day, birthday_month, role)
    values (new.id, payload->>'username', payload->>'first_name', payload->>'last_name', nullif(payload->>'job_title',''),
      nullif(payload->>'birthday_day','')::smallint, nullif(payload->>'birthday_month','')::smallint, account_role);
  insert into dircom_private.account_security (user_id) values (new.id);
  if account_role = 'admin' then insert into dircom_private.primary_administrator (user_id) values (new.id); end if;
  update auth.users set raw_app_meta_data = raw_app_meta_data - 'dircom_profile' where id = new.id;
  return new;
end;
$$;
create trigger dircom_create_profile after insert or update of raw_app_meta_data on auth.users
  for each row execute function dircom_private.profile_from_auth();

-- Supabase admin updateUserById updates password BEFORE app_metadata, within one
-- transaction. The deferred trigger verifies the nonce at COMMIT, after both writes.
-- Employees cannot edit app_metadata. A prior/consumed nonce cannot be reused.
-- This is authorization around Supabase's native hashing, never custom password crypto.
create function dircom_private.guard_auth_credentials() returns trigger
language plpgsql security definer set search_path = '' as $$
declare update_nonce text; consumed uuid;
begin
  if new.email is distinct from old.email or new.phone is distinct from old.phone then
    raise exception 'Technical authentication identity is immutable';
  end if;
  if new.encrypted_password is distinct from old.encrypted_password then
    select raw_app_meta_data->>'dircom_password_nonce' into update_nonce from auth.users where id = new.id;
    delete from dircom_private.password_updates where user_id = new.id and nonce::text = update_nonce
      and expires_at > clock_timestamp() returning nonce into consumed;
    if consumed is null then raise exception 'Password updates require administrative authorization'; end if;
    update dircom_private.account_security set valid_after = clock_timestamp() where user_id = new.id;
    update auth.users set raw_app_meta_data = raw_app_meta_data - 'dircom_password_nonce' where id = new.id;
  end if;
  return new;
end;
$$;
create constraint trigger dircom_guard_auth_credentials after update on auth.users
  deferrable initially deferred for each row
  when (old.encrypted_password is distinct from new.encrypted_password or old.email is distinct from new.email or old.phone is distinct from new.phone)
  execute function dircom_private.guard_auth_credentials();

create function dircom_private.resolve_username(p_username text) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.profiles where username = p_username and is_active;
$$;
create function public.dircom_resolve_username(p_username text) returns uuid
language sql security invoker set search_path = '' as $$ select dircom_private.resolve_username(p_username); $$;

create function dircom_private.can_bootstrap() returns boolean
language sql stable security definer set search_path = '' as $$ select not exists (select 1 from public.profiles where role = 'admin'); $$;
create function public.dircom_can_bootstrap() returns boolean
language sql security invoker set search_path = '' as $$ select dircom_private.can_bootstrap(); $$;

create function dircom_private.consume_login_budget(p_subjects text[]) returns boolean
language plpgsql security definer set search_path = '' as $$
declare subject_key text; used integer; allowed boolean := true; maximum integer;
begin
  if cardinality(p_subjects) not between 2 and 3 then raise exception 'Invalid budget keys'; end if;
  delete from dircom_private.login_budgets where window_started_at < now() - interval '1 day';
  for subject_key in select distinct unnest(p_subjects) order by 1 loop
    maximum := case when subject_key like 'account:%' then 8 when subject_key like 'ip:%' then 30 when subject_key = 'global' then 200 else 0 end;
    if maximum = 0 then raise exception 'Invalid budget key'; end if;
    insert into dircom_private.login_budgets as b (subject, window_started_at, attempts) values (subject_key, clock_timestamp(), 1)
      on conflict (subject) do update set
        attempts = case when b.window_started_at < clock_timestamp() - interval '15 minutes' then 1 else b.attempts + 1 end,
        window_started_at = case when b.window_started_at < clock_timestamp() - interval '15 minutes' then clock_timestamp() else b.window_started_at end
      returning attempts into used;
    if used > maximum then allowed := false; end if;
  end loop;
  return allowed;
end;
$$;
create function public.dircom_consume_login_budget(p_subjects text[]) returns boolean
language sql security invoker set search_path = '' as $$ select dircom_private.consume_login_budget(p_subjects); $$;

create function dircom_private.issue_password_update(p_user_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare token uuid := gen_random_uuid();
begin
  if not exists (select 1 from public.profiles where id = p_user_id and role = 'employee') then raise exception 'Invalid employee'; end if;
  insert into dircom_private.password_updates values (p_user_id, token, clock_timestamp() + interval '3 minutes')
    on conflict (user_id) do update set nonce = excluded.nonce, expires_at = excluded.expires_at;
  return token;
end;
$$;
create function public.dircom_issue_password_update(p_user_id uuid) returns uuid
language sql security invoker set search_path = '' as $$ select dircom_private.issue_password_update(p_user_id); $$;
create function dircom_private.cancel_password_update(p_user_id uuid, p_nonce uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin delete from dircom_private.password_updates where user_id = p_user_id and nonce = p_nonce; return true; end;
$$;
create function public.dircom_cancel_password_update(p_user_id uuid, p_nonce uuid) returns boolean
language sql security invoker set search_path = '' as $$ select dircom_private.cancel_password_update(p_user_id, p_nonce); $$;

-- Only the backend's service role can resolve usernames, throttle or issue grants.
revoke all on function public.dircom_resolve_username(text), public.dircom_can_bootstrap(), public.dircom_consume_login_budget(text[]),
  public.dircom_issue_password_update(uuid), public.dircom_cancel_password_update(uuid,uuid) from public, anon, authenticated;
grant execute on function public.dircom_resolve_username(text), public.dircom_can_bootstrap(), public.dircom_consume_login_budget(text[]),
  public.dircom_issue_password_update(uuid), public.dircom_cancel_password_update(uuid,uuid) to service_role;
grant execute on all functions in schema dircom_private to service_role;

comment on schema dircom_private is 'Never add to exposed Data API schemas. Security helpers have fixed search_path and no client table access.';
commit;
