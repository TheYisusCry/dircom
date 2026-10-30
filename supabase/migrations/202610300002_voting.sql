begin;

create table public.voting_rounds (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 3 and 100),
  week_label text not null check (length(btrim(week_label)) between 3 and 100),
  status text not null check (status in ('open', 'closed', 'published')) default 'open',
  opens_at timestamptz not null default now(),
  closes_at timestamptz not null,
  created_at timestamptz not null default now(),
  winner_id uuid references public.profiles(id) on delete set null,
  podium jsonb default '[]'::jsonb,
  constraint valid_voting_window check (closes_at > opens_at)
);

create table public.voting_ballots_cast (
  round_id uuid not null references public.voting_rounds(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  voted_at timestamptz not null default now(),
  primary key (round_id, voter_id)
);

create table public.voting_votes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.voting_rounds(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.voting_rounds enable row level security;
alter table public.voting_ballots_cast enable row level security;
alter table public.voting_votes enable row level security;

revoke all on public.voting_rounds, public.voting_ballots_cast, public.voting_votes from public, anon, authenticated;
grant select on public.voting_rounds to authenticated;
grant select on public.voting_ballots_cast to authenticated;
grant all on public.voting_rounds, public.voting_ballots_cast, public.voting_votes to service_role;

create policy voting_rounds_read on public.voting_rounds
  for select to authenticated
  using (dircom_private.is_active_member());

create policy ballots_cast_own on public.voting_ballots_cast
  for select to authenticated
  using (voter_id = auth.uid() and dircom_private.is_active_member());

-- Atomic voting function
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

  select status, closes_at into v_round from public.voting_rounds where id = p_round_id;
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

revoke all on function dircom_private.cast_vote(uuid, uuid) from public, anon;
grant execute on function dircom_private.cast_vote(uuid, uuid) to authenticated;

create or replace function public.cast_vote(p_round_id uuid, p_candidate_id uuid)
returns boolean
language sql security invoker set search_path = '' as $$
  select dircom_private.cast_vote(p_round_id, p_candidate_id);
$$;

revoke all on function public.cast_vote(uuid, uuid) from public, anon;
grant execute on function public.cast_vote(uuid, uuid) to authenticated;

commit;
