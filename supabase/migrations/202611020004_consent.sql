begin;

-- Añadir columnas de consentimiento a perfiles
alter table public.profiles
  add column if not exists consent_accepted_at timestamptz null,
  add column if not exists consent_version text null;

-- Tabla de auditoría legal interna
create table if not exists dircom_private.consent_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  signer_name text not null check (length(btrim(signer_name)) > 0),
  accepted_at timestamptz not null default now(),
  consent_version text not null default 'v1',
  user_agent text null
);

revoke all on dircom_private.consent_logs from public, anon, authenticated;
grant all on dircom_private.consent_logs to service_role;

-- Re-declarar my_profile para refrescar el descriptor de fila con las nuevas columnas
create or replace function dircom_private.my_profile() returns setof public.profiles
language sql stable security definer set search_path = '' as $$
  select p.* from public.profiles p where p.id = auth.uid() and dircom_private.is_active_member();
$$;

-- Función interna con privilegios elevados en dircom_private
create or replace function dircom_private.record_consent(
  p_version text default 'v1',
  p_user_agent text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_profile public.profiles%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  select * into v_profile
  from public.profiles
  where id = v_user_id and is_active = true;

  if not found then
    raise exception 'Perfil activo no encontrado';
  end if;

  if v_profile.role <> 'employee' then
    return true;
  end if;

  if v_profile.consent_accepted_at is not null and v_profile.consent_version = coalesce(p_version, 'v1') then
    return true;
  end if;

  update public.profiles
  set consent_accepted_at = clock_timestamp(),
      consent_version = coalesce(p_version, 'v1')
  where id = v_user_id;

  insert into dircom_private.consent_logs (
    user_id,
    signer_name,
    accepted_at,
    consent_version,
    user_agent
  ) values (
    v_user_id,
    btrim(v_profile.first_name || ' ' || v_profile.last_name),
    clock_timestamp(),
    coalesce(p_version, 'v1'),
    p_user_agent
  );

  return true;
end;
$$;

revoke all on function dircom_private.record_consent(text, text) from public, anon;
grant execute on function dircom_private.record_consent(text, text) to authenticated;

-- Wrapper público seguro con SECURITY INVOKER
create or replace function public.dircom_record_consent(
  p_version text default 'v1',
  p_user_agent text default null
)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select dircom_private.record_consent(p_version, p_user_agent);
$$;

revoke all on function public.dircom_record_consent(text, text) from public, anon;
grant execute on function public.dircom_record_consent(text, text) to authenticated;

commit;
