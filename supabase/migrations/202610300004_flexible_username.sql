begin;

-- Permitir nombres de usuario de 3 a 32 caracteres sin restricciones innecesarias
alter table public.profiles drop constraint if exists profiles_username_check;

alter table public.profiles add constraint profiles_username_check
  check (
    length(btrim(username)) between 3 and 32
    and username = lower(btrim(username))
  );

commit;
