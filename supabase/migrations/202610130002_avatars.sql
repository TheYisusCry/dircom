begin;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('dircom-avatars', 'dircom-avatars', false, 3145728, array['image/jpeg','image/png','image/webp']);

-- No authenticated INSERT/UPDATE/DELETE policy. All writes use a guarded server action.
create policy dircom_read_current_avatar on storage.objects for select to authenticated using (
  bucket_id = 'dircom-avatars' and dircom_private.is_active_member() and
  exists (select 1 from public.profiles p where p.avatar_path = storage.objects.name)
);
commit;
