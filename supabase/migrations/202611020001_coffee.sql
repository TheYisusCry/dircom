begin;

create table public.coffee_deliveries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0 and quantity <= 10),
  delivery_date date not null default (current_timestamp at time zone 'America/La_Paz')::date,
  note text null check (note is null or length(btrim(note)) <= 120),
  registered_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.coffee_deliveries enable row level security;

revoke all on public.coffee_deliveries from public, anon, authenticated;
grant select on public.coffee_deliveries to authenticated;
grant all on public.coffee_deliveries to service_role;

create policy coffee_deliveries_read on public.coffee_deliveries
  for select to authenticated
  using (dircom_private.is_active_member());

create index idx_coffee_deliveries_employee on public.coffee_deliveries(employee_id);
create index idx_coffee_deliveries_date on public.coffee_deliveries(delivery_date desc);

-- Vista segura de empleados activos (excluye administradores y cuentas inactivas)
create view public.active_employees with (security_invoker = false) as
  select p.id, p.first_name, p.last_name, p.job_title, p.avatar_path, p.created_at
  from public.profiles p
  where p.role = 'employee' and p.is_active = true;

revoke all on public.active_employees from public, anon;
grant select on public.active_employees to authenticated;

-- Vista segura de miembros participantes en la cuota de café
create view public.coffee_members with (security_invoker = false) as
  select * from public.active_employees;

revoke all on public.coffee_members from public, anon;
grant select on public.coffee_members to authenticated;

commit;
