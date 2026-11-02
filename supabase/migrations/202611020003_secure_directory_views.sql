begin;

-- These two views need role/is_active/created_at, which deliberately are not
-- readable columns of profiles for authenticated clients. Keep their existing
-- definitions and move access to the already-authenticated application backend
-- instead of widening profile column privileges to make invoker views work.
alter view public.active_employees set (security_invoker = true);
alter view public.coffee_members set (security_invoker = true);

-- Revoke ALL, including any write grants inherited from Supabase defaults.
revoke all on public.active_employees, public.coffee_members
  from public, anon, authenticated;
grant select on public.active_employees, public.coffee_members to service_role;

-- The public internal directory stays available to active authenticated members
-- through profiles RLS, with its existing seven columns and SELECT only.
alter view public.employee_directory set (security_invoker = true);
revoke all on public.employee_directory from public, anon, authenticated;
grant select on public.employee_directory to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
