-- Read-only catalog audit. Returns object names and privileges, never user data.
-- Run in Supabase SQL Editor before/after the migration. No rows means none of
-- THESE checks found a mismatch; it is not a complete security certification.
select 'security_definer_view' as check_name,
       n.nspname || '.' || c.relname as entity,
       'Vista public sin security_invoker=true.' as detail
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v'
  and not coalesce(c.reloptions @> array['security_invoker=true'], false)

union all
select 'public_table_without_rls', n.nspname || '.' || c.relname,
       'Tabla public sin RLS; revisar también los grants de cliente.'
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity

union all
select 'client_write_grant_on_view', n.nspname || '.' || c.relname,
       r.rolname || ' tiene grants de escritura sobre esta vista; comprobar RLS subyacente.'
from pg_class c join pg_namespace n on n.oid = c.relnamespace
cross join pg_roles r
where n.nspname = 'public' and c.relkind = 'v'
  and r.rolname in ('anon', 'authenticated')
  and (has_table_privilege(r.oid, c.oid, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       or has_any_column_privilege(r.oid, c.oid, 'INSERT,UPDATE,REFERENCES'))

union all
select 'anon_select_grant', n.nspname || '.' || c.relname,
       'anon tiene SELECT; DIRCOM no necesita lectura anónima en estos objetos.'
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
  and has_any_column_privilege('anon', c.oid, 'SELECT')

union all
select 'exposed_definer_function', n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
       'Función SECURITY DEFINER en public ejecutable por un rol de cliente.'
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
  and (has_function_privilege('anon', p.oid, 'EXECUTE') or has_function_privilege('authenticated', p.oid, 'EXECUTE'))

union all
select 'function_without_fixed_search_path', n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')',
       'Función SQL/PLpgSQL propia sin search_path explícito.'
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
join pg_language l on l.oid = p.prolang
where n.nspname in ('public', 'dircom_private') and p.prokind = 'f'
  and l.lanname in ('sql', 'plpgsql')
  and not exists (select 1 from unnest(p.proconfig) setting where setting like 'search_path=%')
  and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e')

union all
select 'unexpected_profile_column_grant', 'public.profiles.' || a.attname,
       'authenticated puede leer directamente una columna fuera del directorio permitido.'
from pg_attribute a
where a.attrelid = 'public.profiles'::regclass and a.attnum > 0 and not a.attisdropped
  and a.attname in ('username', 'role', 'is_active', 'created_at', 'updated_at')
  and has_column_privilege('authenticated', a.attrelid, a.attname, 'SELECT')

union all
select 'client_private_table_grant', n.nspname || '.' || c.relname,
       r.rolname || ' tiene permisos sobre una tabla de seguridad interna.'
from pg_class c join pg_namespace n on n.oid = c.relnamespace
cross join pg_roles r
where n.nspname = 'dircom_private' and c.relkind in ('r', 'p')
  and r.rolname in ('anon', 'authenticated')
  and (has_table_privilege(r.oid, c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       or has_any_column_privilege(r.oid, c.oid, 'SELECT,INSERT,UPDATE,REFERENCES'))
order by check_name, entity, detail;
