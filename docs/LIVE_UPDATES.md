# Actualizaciones en directo de DIRCOM

## Cambios incluidos

- Una conexión Supabase Realtime por pestaña autenticada, compartida por actividades, mensajes y rondas de votación.
- Lecturas por sección: un mensaje no vuelve a consultar cumpleaños, café ni votaciones.
- Tarjetas con los tres mensajes más recientes y contador total. El modal carga páginas de 50 mensajes y recupera los nuevos por cursor.
- Cumpleaños/directorio: comprobación cada cinco minutos, al recuperar el foco y al cambiar el día en America/La_Paz. Café: cada minuto.
- Consulta del estado al reconectar y respaldo por HTTP cada 15 segundos si Realtime está desconectado. Una comprobación cada cinco minutos recupera eventos perdidos aun con conexión activa. Las consultas se pausan en pestañas ocultas.
- El panel administrativo comprueba participación cada 15 segundos sin emitir votos individuales por Realtime.
- Acciones propias: actualización después de confirmar la escritura, con mensajes deduplicados por ID.
- Cierre y recuento de votación en PostgreSQL, bloqueando la ronda para coordinar votos y publicaciones. Repetir una publicación conserva el resultado y su hora original.
- Revelación visual diez segundos después de preparar el podio, usando la hora del servidor y un reloj monotónico del navegador. Las fotos se preparan durante la cuenta regresiva.

## Lo que debe hacer el propietario en Supabase

1. Abrir el proyecto que utiliza DIRCOM y su SQL Editor.
2. Comprobar que ya estén aplicadas las migraciones previas, incluida `202611020001_coffee.sql`. No volver a ejecutar indiscriminadamente las migraciones antiguas.
3. Ejecutar **todo** `supabase/migrations/202611020002_live_updates.sql`. No elimina tablas, cuentas, mensajes ni resultados. Añade `reveal_at`, un índice para mensajes, funciones de cierre/publicación y el bloqueo de ronda al votar.
4. La migración añade `activities`, `activity_messages` y `voting_rounds` a `supabase_realtime` si esa publicación existe. Verificar esas tres tablas en Database → Publications → supabase_realtime. Si falta alguna, habilitarla allí. No hace falta habilitar `profiles`, `voting_votes` ni `voting_ballots_cast`.
5. Conservar RLS y el acceso autenticado actuales. No habilitar lectura anónima ni desactivar políticas para hacer funcionar Realtime. Los permisos de Postgres Changes se rigen por las tablas de origen; esta implementación no usa Broadcast ni Presence.

Consulta de comprobación, sin escrituras:

```sql
select tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename in ('activities', 'activity_messages', 'voting_rounds');

select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'voting_rounds'
  and column_name = 'reveal_at';
```

La primera consulta debe devolver las tres tablas; la segunda, `reveal_at`.

## Lo que debe hacer el propietario en Vercel

Aplicar primero la migración y después desplegar el código.

Verificar en Settings → Environment Variables las variables existentes, para el entorno que se desplegará:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo servidor; nunca agregarle `NEXT_PUBLIC_`)

No se añaden nuevas variables, paquetes, servidores WebSocket, tareas Cron ni servicios. Si las variables ya son correctas, basta el despliegue habitual. Si se cambia una variable, crear un nuevo despliegue; las variables públicas se incorporan al build.

El navegador se conecta directamente a Supabase para Realtime. Vercel sirve la aplicación y sus rutas HTTP breves. No alojamos conexiones WebSocket en Vercel Functions.

## Prueba entre navegadores después del despliegue

1. Abrir DIRCOM con dos empleados en perfiles/navegadores distintos y una sesión de administrador. Mantener las páginas visibles.
2. Crear una actividad. Comprobar que aparece en el otro navegador sin recargar.
3. Abrir el mismo modal, escribir un borrador y enviar un mensaje desde la otra sesión. Debe aparecer sin duplicarse y conservar el borrador.
4. Cerrar la actividad. Ambos modales deben dejar de admitir pedidos. Probar también la eliminación del tablero.
5. Abrir una ronda, votar, cerrarla y pulsar «Revelar podio en 10 segundos». En las portadas debe aparecer la cuenta regresiva y después el mismo ganador/podio con confeti.
6. Cambiar el reloj de un dispositivo antes de abrir la página: la cuenta regresiva debe seguir la hora del servidor. Comparar las revelaciones mediante una grabación si se quiere medir la diferencia real.
7. Desconectar un navegador y volver a conectarlo. Debe recuperar el estado actual. Entrar después de la revelación no debe repetir el confeti.
8. Dejar una pestaña oculta y volver. Debe actualizarse sin recarga manual.

## Alcance y límites

El podio se envía a los miembros autenticados durante la preparación; la hora común sincroniza su presentación, no garantiza secreto ante quien inspeccione la red. Los votos individuales mantienen sus permisos actuales. No hay garantía de presentación en el mismo milisegundo: las pestañas suspendidas, las desconexiones y el rendimiento del dispositivo afectan al momento visible.

Las rondas antiguas, sin `reveal_at`, continúan mostrando sus resultados sin repetir la celebración. Una ronda sin votos no inventa un ganador. Se conserva la clasificación por cantidad de votos. El esquema anterior no definía una regla de negocio para los empates y este cambio no añade una; el resultado calculado se guarda una sola vez y todos consultan ese mismo podio.

El token de acceso de corta duración se entrega por una ruta autenticada sin caché y se conserva en memoria para Realtime. Las cookies siguen siendo HttpOnly; el token de renovación y la clave administrativa no se envían al navegador. Se comprueba la sesión en cada lectura HTTP.

La prueba local de PostgreSQL utiliza PGlite y esquemas Auth/Storage simulados. No sustituye la prueba de WebSockets, renovación de credenciales y políticas en el proyecto Supabase real.

Referencias oficiales consultadas:

- [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Variables de entorno de Vercel](https://vercel.com/docs/environment-variables)
- [WebSockets y proveedores Realtime en Vercel](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections)

## Validación local de esta entrega

Lint y TypeScript correctos; 53 pruebas locales aprobadas. La compilación de producción queda sin verificar: Turbopack falla al iniciar el proceso auxiliar de CSS (también fuera del sandbox). Se reprodujo el mismo fallo con una aplicación mínima que solo importa Tailwind, sin código de DIRCOM. No se modificaron la configuración de estilos ni dependencias para intentar resolverlo. Antes de dar por finalizada la activación, comprobar el build del despliegue y la prueba entre navegadores descrita arriba.
