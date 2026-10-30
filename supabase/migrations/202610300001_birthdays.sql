begin;

create table public.birthday_celebrations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(btrim(title)) between 3 and 100),
  invitation text not null check (length(btrim(invitation)) between 5 and 1500),
  starts_at timestamptz not null,
  location text not null check (length(btrim(location)) between 3 and 150),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.birthday_celebrations enable row level security;
revoke all on public.birthday_celebrations from public, anon, authenticated;
grant select on public.birthday_celebrations to authenticated;
grant all on public.birthday_celebrations to service_role;

create function dircom_private.is_active_employee(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles where id = p_id and is_active
  );
$$;
revoke all on function dircom_private.is_active_employee(uuid) from public, anon;
grant execute on function dircom_private.is_active_employee(uuid) to authenticated;

create policy celebrations_active_directory on public.birthday_celebrations
  for select to authenticated
  using (
    dircom_private.is_active_member() and
    dircom_private.is_active_employee(employee_id)
  );

commit;
