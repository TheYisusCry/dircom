begin;

-- Serve photographs through /api/avatars/[id], with live session checks and
-- private/no-store responses. Direct Storage downloads can cache previously
-- authorized responses after a profile or session has been revoked.
-- All profile data RLS remains intact; only the backend downloads the bytes.
drop policy if exists dircom_read_current_avatar on storage.objects;

commit;
