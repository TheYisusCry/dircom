begin;

alter table public.voting_rounds add column if not exists reveal_at timestamptz;
create index if not exists activity_messages_activity_order
  on public.activity_messages(activity_id, created_at desc, id desc);

-- Lock the same round for voting, closing and publishing. The public wrappers
-- keep using the caller's authenticated session, including revocation checks.
create or replace function dircom_private.close_voting_round(p_round_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_round public.voting_rounds;
begin
  if not dircom_private.is_active_member() or not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_active
  ) then raise exception 'Solo el administrador puede cerrar la votacion'; end if;
  select * into v_round from public.voting_rounds where id = p_round_id for update;
  if not found then raise exception 'La ronda no existe'; end if;
  if v_round.status = 'published' then raise exception 'La ronda ya fue publicada'; end if;
  if v_round.status = 'open' then
    update public.voting_rounds set status = 'closed',
      closes_at = greatest(clock_timestamp(), opens_at + interval '1 microsecond')
      where id = p_round_id;
  end if;
  return true;
end;
$$;
revoke all on function dircom_private.close_voting_round(uuid) from public, anon;
grant execute on function dircom_private.close_voting_round(uuid) to authenticated;
create or replace function public.dircom_close_voting_round(p_round_id uuid)
returns boolean language sql security invoker set search_path = '' as $$
  select dircom_private.close_voting_round(p_round_id);
$$;
revoke all on function public.dircom_close_voting_round(uuid) from public, anon;
grant execute on function public.dircom_close_voting_round(uuid) to authenticated;

create or replace function dircom_private.publish_voting_results(p_round_id uuid)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare
  v_round public.voting_rounds;
  v_podium jsonb;
  v_reveal_at timestamptz;
begin
  if not dircom_private.is_active_member() or not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_active
  ) then raise exception 'Solo el administrador puede publicar resultados'; end if;
  select * into v_round from public.voting_rounds where id = p_round_id for update;
  if not found then raise exception 'La ronda no existe'; end if;
  -- Repeated requests preserve both the result and the original deadline.
  if v_round.status = 'published' then return v_round.reveal_at; end if;
  if v_round.status <> 'closed' then raise exception 'Primero debes cerrar la votacion'; end if;

  with tally as (
    select candidate_id, count(*) as votes from public.voting_votes
      where round_id = p_round_id group by candidate_id
  ), ranked as (
    -- Preserve the existing vote-count ranking; no new business tie-break rule.
    select *, row_number() over (order by votes desc) as position from tally
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'position', r.position, 'employee_id', r.candidate_id,
    'employee_name', coalesce(p.first_name || ' ' || p.last_name, 'Empleado'),
    'employee_role', coalesce(p.job_title, 'Equipo DIRCOM'),
    'employee_photo', case when p.avatar_path is not null then '/api/avatars/' || p.id::text else null end,
    'votes', r.votes,
    'recognition', (array['Espíritu de equipo', 'Creatividad que inspira', 'Siempre dispuesto a ayudar'])[r.position::integer]
  ) order by r.position), '[]'::jsonb) into v_podium
    from ranked r left join public.profiles p on p.id = r.candidate_id where r.position <= 3;

  v_reveal_at := clock_timestamp() + interval '10 seconds';
  update public.voting_rounds set status = 'published', podium = v_podium,
    winner_id = (v_podium->0->>'employee_id')::uuid, reveal_at = v_reveal_at
    where id = p_round_id;
  return v_reveal_at;
end;
$$;
revoke all on function dircom_private.publish_voting_results(uuid) from public, anon;
grant execute on function dircom_private.publish_voting_results(uuid) to authenticated;
create or replace function public.dircom_publish_voting_results(p_round_id uuid)
returns timestamptz language sql security invoker set search_path = '' as $$
  select dircom_private.publish_voting_results(p_round_id);
$$;
revoke all on function public.dircom_publish_voting_results(uuid) from public, anon;
grant execute on function public.dircom_publish_voting_results(uuid) to authenticated;

create or replace function dircom_private.cast_vote(p_round_id uuid, p_candidate_id uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_voter_id uuid := auth.uid();
  v_round record;
  v_voter record;
  v_candidate record;
begin
  if not dircom_private.is_active_member() then
    raise exception 'Sesion no autorizada';
  end if;

  select role, is_active into v_voter from public.profiles where id = v_voter_id;
  if v_voter is null or not v_voter.is_active or v_voter.role <> 'employee' then
    raise exception 'Solo los empleados activos pueden votar';
  end if;

  if p_candidate_id = v_voter_id then
    raise exception 'No puedes votar por ti mismo';
  end if;

  select role, is_active into v_candidate from public.profiles where id = p_candidate_id;
  if v_candidate is null or not v_candidate.is_active or v_candidate.role <> 'employee' then
    raise exception 'El candidato seleccionado no es valido';
  end if;

  select status, closes_at into v_round from public.voting_rounds where id = p_round_id for update;
  if v_round is null then
    raise exception 'La ronda de votacion no existe';
  end if;
  if v_round.status <> 'open' then
    raise exception 'La votacion no esta abierta';
  end if;
  if clock_timestamp() > v_round.closes_at then
    raise exception 'El tiempo para votar ha finalizado';
  end if;

  if exists (select 1 from public.voting_ballots_cast where round_id = p_round_id and voter_id = v_voter_id) then
    raise exception 'Ya has emitido tu voto en esta ronda';
  end if;

  insert into public.voting_ballots_cast (round_id, voter_id, voted_at)
    values (p_round_id, v_voter_id, clock_timestamp());

  insert into public.voting_votes (round_id, candidate_id, created_at)
    values (p_round_id, p_candidate_id, clock_timestamp());

  return true;
end;
$$;


-- Supabase owns this publication. In local PostgreSQL test environments it may
-- not exist. On Supabase, add only these tables, preserving existing entries.
do $$
declare v_table text;
begin
  if exists(select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach v_table in array array['activities', 'activity_messages', 'voting_rounds'] loop
      if not exists(select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = v_table) then
        execute format('alter publication supabase_realtime add table public.%I', v_table);
      end if;
    end loop;
  end if;
end;
$$;

commit;
