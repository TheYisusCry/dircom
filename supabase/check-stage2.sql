-- Read-only, one result set for the CLI. No identities or credentials are returned.
select jsonb_build_object(
  'profiles_rls', (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'triggers', (select jsonb_agg(jsonb_build_object(
    'schema', n.nspname, 'table', c.relname, 'name', t.tgname,
    'deferrable', t.tgdeferrable, 'initially_deferred', t.tginitdeferred))
    from pg_trigger t join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where not t.tgisinternal and t.tgname like 'dircom_%'),
  'policies', (select jsonb_agg(jsonb_build_object(
    'schema', schemaname, 'table', tablename, 'name', policyname,
    'roles', roles, 'command', cmd, 'condition', qual, 'write_condition', with_check))
    from pg_policies where (schemaname = 'public' and tablename = 'profiles')
    or (schemaname = 'storage' and tablename = 'objects')),
  'client_table_grants', (select jsonb_agg(jsonb_build_object('role', grantee, 'privilege', privilege_type))
    from information_schema.table_privileges where table_schema = 'public' and table_name = 'profiles'
    and grantee in ('anon','authenticated')),
  'client_column_grants', (select jsonb_agg(jsonb_build_object('role', grantee, 'column', column_name, 'privilege', privilege_type))
    from information_schema.column_privileges where table_schema = 'public' and table_name = 'profiles'
    and grantee in ('anon','authenticated')),
  'helpers', (select jsonb_agg(jsonb_build_object('name', p.proname, 'owner', pg_get_userbyid(p.proowner), 'security_definer', p.prosecdef, 'configuration', p.proconfig))
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'dircom_private'),
  'anon_username_lookup', has_function_privilege('anon','public.dircom_resolve_username(text)','execute'),
  'employee_password_permit', has_function_privilege('authenticated','public.dircom_issue_password_update(uuid)','execute'),
  'client_admin_password_permit', has_function_privilege('authenticated','public.dircom_issue_admin_password_update(uuid)','execute'),
  'server_admin_password_permit', has_function_privilege('service_role','public.dircom_issue_admin_password_update(uuid)','execute'),
  'anon_own_profile', has_function_privilege('anon','public.dircom_my_profile()','execute'),
  'authenticated_own_profile', has_function_privilege('authenticated','public.dircom_my_profile()','execute'),
  'bucket', (select jsonb_build_object('private', not public, 'limit', file_size_limit, 'mime_types', allowed_mime_types)
    from storage.buckets where id = 'dircom-avatars'),
  'profile_count', (select count(*) from public.profiles),
  'administrator_count', (select count(*) from public.profiles where role = 'admin')
) as stage2;
