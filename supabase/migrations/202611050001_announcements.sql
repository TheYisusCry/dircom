begin;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 3 and 120),
  description text check (description is null or length(btrim(description)) between 1 and 1000),
  tone text not null check (tone in ('urgent', 'coffee', 'general', 'celebration')) default 'general',
  status text not null check (status in ('active', 'closed')) default 'active',
  creator_id uuid not null references public.profiles(id) on delete cascade,
  closed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

alter table public.announcements enable row level security;

revoke all on public.announcements from public, anon, authenticated;
grant select, insert, update on public.announcements to authenticated;
grant all on public.announcements to service_role;

create policy announcements_read on public.announcements
  for select to authenticated
  using (dircom_private.is_active_member());

create policy announcements_insert on public.announcements
  for insert to authenticated
  with check (
    dircom_private.is_active_member()
    and creator_id = auth.uid()
    and status = 'active'
  );

create policy announcements_update on public.announcements
  for update to authenticated
  using (dircom_private.is_active_member())
  with check (
    dircom_private.is_active_member()
    and status = 'closed'
  );

commit;
