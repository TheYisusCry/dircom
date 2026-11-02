# Vistas del directorio: revisión y corrección

## Hallazgos en el esquema del repositorio

`active_employees` y `coffee_members` se crearon con `security_invoker=false` y lectura para `authenticated`. Eso evita aplicar a sus consultas la política de `profiles` que comprueba la sesión vigente. Aunque no había lectura anónima concedida expresamente, una identidad con JWT aún válido pero sesión revocada podía consultar estas vistas directamente por la Data API. Los datos afectados son los campos de presentación y fecha de alta de empleados activos; no incluyen contraseñas.

Además, las tres vistas del proyecto revocaban privilegios a PUBLIC y anon, pero no todos los privilegios de authenticated antes de conceder SELECT. En proyectos Supabase con grants por defecto amplios, podrían conservar permisos de escritura heredados. Un grant no demuestra por sí solo que una escritura supere las políticas subyacentes, pero en vistas con permisos de propietario es especialmente relevante. Las pruebas locales ahora simulan esos grants por defecto.

`employee_directory` ya utilizaba `security_invoker=true`. Las ocho tablas public del proyecto tienen RLS. Las funciones públicas son wrappers invoker. Los helpers SECURITY DEFINER están en `dircom_private`, tienen search_path fijo y permisos explícitos; cumplen funciones de autorización y no deben convertirse indiscriminadamente en invoker. El esquema privado debe permanecer fuera de los esquemas expuestos por la Data API.

Estas conclusiones se basan en las migraciones y pruebas locales. No se ha inspeccionado el catálogo completo de la instancia remota ni se ha ejecutado una corrección en Supabase.

## Corrección preparada

La migración `202611020003_secure_directory_views.sql` conserva las definiciones y datos existentes, pone ambas vistas en modo invoker y limita su lectura a `service_role`. La aplicación consulta esas dos vistas exclusivamente desde el backend, después de verificar la sesión, usando una selección explícita de columnas. El navegador no recibe la clave administrativa.

El resto de lecturas continúa usando el cliente de sesión y RLS. `employee_directory` conserva SELECT para authenticated con RLS de perfiles. No se amplían los permisos de lectura sobre username, rol, estado, fecha de alta ni fecha de modificación de la tabla `profiles`. Las tres vistas pierden cualquier permiso de escritura heredado para clientes.

## Aplicación por el propietario

1. Desplegar primero el cambio de `src/lib/dashboard.ts`, que consulta las vistas con el cliente de servidor. Este código es compatible con las vistas anteriores; aplicar primero el SQL y dejar código antiguo puede interrumpir café/candidatos.
2. En Supabase → SQL Editor, ejecutar completa `supabase/migrations/202611020003_secure_directory_views.sql`, después de las migraciones previas.
3. Ejecutar `scripts/audit-database-security.sql`: solo consulta metadatos. Revisar cualquier fila devuelta y volver a ejecutar Security Advisor.
4. Probar con una cuenta de empleado la portada, candidatos y café. Las peticiones directas de clientes autenticados a `active_employees` y `coffee_members` deben rechazarse; las rutas autenticadas de la aplicación deben funcionar.

No se borran empleados, sesiones, entregas, actividades, votos ni resultados. No se necesitan nuevas variables de entorno.

## Búsqueda de otros problemas

La consulta de auditoría busca vistas definer, tablas public sin RLS, grants de escritura en vistas, SELECT anónimo, funciones definer expuestas a clientes, funciones propias sin search_path fijo, columnas privadas de perfiles legibles y permisos sobre tablas internas. Es un diagnóstico del catálogo, no una auditoría integral de la aplicación ni un sustituto de Security Advisor. Hallazgos de extensiones u objetos ajenos a DIRCOM requieren interpretación antes de cambiar sus permisos.

Referencias: [Supabase: RLS y vistas](https://supabase.com/docs/guides/database/postgres/row-level-security#views-and-rls), [PostgreSQL: permisos de vistas invoker](https://www.postgresql.org/docs/17/sql-createview.html), [Supabase Advisors](https://supabase.com/docs/guides/observability/advisors).
