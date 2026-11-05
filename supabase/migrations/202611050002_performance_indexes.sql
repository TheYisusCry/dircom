begin;

-- Indice para filtrar y ordenar anuncios activos en el tablero
create index if not exists announcements_status_created_at_idx
  on public.announcements (status, created_at desc);

-- Indice para contar y listar mensajes por actividad cronologicamente
create index if not exists activity_messages_activity_id_created_at_idx
  on public.activity_messages (activity_id, created_at desc, id desc);

-- Indice para ordenar actividades recientes en el inicio
create index if not exists activities_created_at_idx
  on public.activities (created_at desc);

-- Indice para consultar rapidamente los votos emitidos por un usuario
create index if not exists voting_ballots_cast_voter_round_idx
  on public.voting_ballots_cast (voter_id, round_id);

commit;
