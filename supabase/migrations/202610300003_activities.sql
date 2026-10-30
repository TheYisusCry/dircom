begin;

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 3 and 100),
  category text not null check (category in ('food', 'coffee', 'social')) default 'food',
  description text not null check (length(btrim(description)) between 3 and 1000),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('open', 'closed')) default 'open',
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.activity_messages (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (length(btrim(text)) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.activities enable row level security;
alter table public.activity_messages enable row level security;

revoke all on public.activities, public.activity_messages from public, anon, authenticated;
grant select on public.activities, public.activity_messages to authenticated;
grant all on public.activities, public.activity_messages to service_role;

create policy activities_read on public.activities
  for select to authenticated
  using (dircom_private.is_active_member());

create policy activity_messages_read on public.activity_messages
  for select to authenticated
  using (dircom_private.is_active_member());

commit;
