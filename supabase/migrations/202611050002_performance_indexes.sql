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

-- Agregar anuncios a la publicacion en tiempo real de Supabase si existe
do $$
begin
  if exists(select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists(select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'announcements') then
      alter publication supabase_realtime add table public.announcements;
    end if;
  end if;
end;
$$;

commit;
