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

-- Agregar anuncios y entregas de cafe a la publicacion en tiempo real de Supabase si existe
do $$
declare v_table text;
begin
  if exists(select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach v_table in array array['announcements', 'coffee_deliveries'] loop
      if not exists(select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = v_table) then
        execute format('alter publication supabase_realtime add table public.%I', v_table);
      end if;
    end loop;
  end if;
end;
$$;

commit;
