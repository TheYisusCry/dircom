# DIRCOM

Plataforma privada de trabajo para el equipo DIRCOM, construida con Next.js y Supabase. Incluye cuentas de empleados, fotografías privadas, cumpleaños, actividades con pedidos y notas, votación de empleado de la semana y organización de aportes de café.

Los módulos utilizan datos de Supabase. El código de actualizaciones en directo está implementado; su activación requiere aplicar la migración correspondiente y verificar la publicación Realtime en el proyecto remoto. El estado del alojamiento y la aplicación de esa migración no se han comprobado desde este repositorio.

## Preparación y ejecución

Requisitos: Node.js **22.18 o posterior**, npm y un proyecto Supabase dedicado a DIRCOM. Desde esta carpeta:

```powershell
npm ci
Copy-Item .env.example .env.local
```

Si ya existe `.env.local`, conserva su configuración. Completa estas variables con valores del mismo proyecto Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: clave pública.
- `SUPABASE_SERVICE_ROLE_KEY`: clave privada, exclusiva del servidor; admite una clave actual `sb_secret_...` o una `service_role` heredada.

No publiques `.env.local` ni agregues `NEXT_PUBLIC_` a la clave privada. La plantilla no incluye credenciales reales.

La [guía de Supabase](docs/SUPABASE_SETUP.md) documenta la configuración inicial de Auth, perfiles y fotografías. Para una instalación nueva, aplica los archivos de `supabase/migrations/` en orden de nombre. En una instalación existente, aplica únicamente los pendientes. Las migraciones posteriores incorporan cumpleaños, votaciones, actividades, usernames flexibles, café y actualizaciones en directo.

**Limitación de la guía inicial:** todavía referencia `npm run bootstrap:admin` y `scripts/recover-admin.mjs`, que no existen en este checkout. No son comandos ejecutables actualmente; la provisión de una primera cuenta administradora requiere resolver ese procedimiento antes de usar una instalación nueva. Una instalación con administrador existente no necesita repetirlo. Las variables `DIRCOM_ADMIN_*` de la plantilla son referencias de ese procedimiento anterior y no intervienen en el funcionamiento cotidiano.

Para desarrollo:

```powershell
npm run dev
```

Abre `http://localhost:3000/login`. Reinicia el servidor después de cambiar variables. Sin configuración, el login informa que el acceso está en preparación; no simula una sesión.

## Funciones disponibles

- `/login`: acceso por usuario y contraseña, mensajes de error genéricos y limitación persistente de intentos.
- `/`: portada privada con cumpleaños próximos, empleado destacado, podio, votación, café y actividades.
- Actividades: creación de planes, pedidos y notas, cierre y eliminación por el creador o administrador. Las tarjetas muestran los tres mensajes más recientes y el total; el modal carga el historial en páginas de 50 mensajes.
- `/perfil`: perfil del empleado y renuncia con desactivación de su cuenta.
- `/admin`: resumen de cuentas, exclusivo del administrador.
- `/admin/empleados`: lista paginada, contador de empleados activos, alta, edición de datos y fotografía, restablecimiento de contraseña y activación/desactivación. No hay un límite fijo de 12 cuentas.
- `/admin/cumpleanos`: gestión de las celebraciones del equipo.
- `/admin/votaciones`: apertura y cierre de rondas, participación y publicación del podio.
- `/admin/cafe`: registro y eliminación de entregas de café, estados de aportes y clasificación histórica.
- `/admin/cuenta`: cambio de contraseña del administrador, seguido de un nuevo inicio de sesión.
- `/acceso-denegado`: respuesta para empleados que intentan acceder al panel administrativo.

No hay registro público, recuperación pública por correo ni cambio de contraseña por empleados. Los identificadores, usernames y roles son inmutables. La cuenta administradora principal no puede desactivarse ni eliminarse mediante estas operaciones.

## Actualizaciones sin recargar la página

Se utiliza una conexión Supabase Realtime por pestaña autenticada, compartida por actividades, mensajes y rondas de votación. Los eventos provocan lecturas de la sección afectada; no se consulta toda la portada por cada mensaje. Las escrituras continúan pasando por las acciones de servidor existentes.

- **Actividades y modal:** cambios mediante Realtime, recuperación de mensajes nuevos por cursor y deduplicación por identificador. Recibir mensajes conserva el borrador de otro usuario.
- **Votación y podio:** el servidor prepara el resultado y guarda una hora de revelación diez segundos después. Los navegadores muestran una cuenta regresiva usando la referencia horaria del servidor y revelan el mismo podio. El cierre y el recuento bloquean la ronda en PostgreSQL; repetir una publicación conserva el resultado y su hora.
- **Cumpleaños/directorio:** comprobación cada cinco minutos, al recuperar el foco y al cambiar el día en `America/La_Paz`.
- **Café:** comprobación cada minuto mientras la página esté visible.
- **Acciones propias:** actualización después de confirmar la escritura.
- **Recuperación:** consulta al reconectar, respaldo HTTP cada 15 segundos si Realtime está desconectado y comprobaciones cada cinco minutos para recuperar eventos perdidos. Las lecturas periódicas se pausan en pestañas ocultas. Los fallos de lectura del tablero espacian los reintentos.
- **Panel de votaciones:** comprobación de participación cada 15 segundos, sin emitir votos individuales por Realtime.

La revelación coordina la presentación visual; no garantiza el mismo milisegundo en todos los dispositivos. El podio se entrega durante la preparación a los miembros autenticados, por lo que la cuenta regresiva no lo mantiene secreto frente a quien inspeccione los datos recibidos. Las rondas antiguas sin hora de revelación siguen mostrando sus resultados sin repetir el confeti. No se introduce una nueva regla de desempate.

## Activación en Supabase y despliegue en Vercel

Sigue la [guía de actualizaciones en directo](docs/LIVE_UPDATES.md), que incluye comprobaciones SQL y una prueba entre navegadores.

1. Comprueba las migraciones previas, incluida [la de café](supabase/migrations/202611020001_coffee.sql).
2. Ejecuta completa [202611020002_live_updates.sql](supabase/migrations/202611020002_live_updates.sql) en el SQL Editor de Supabase. Añade la hora de revelación, el índice de mensajes y las funciones de cierre/publicación, sin eliminar los datos existentes.
3. Verifica que `activities`, `activity_messages` y `voting_rounds` estén en la publicación `supabase_realtime`. La migración las añade si esa publicación existe. Conserva RLS y las políticas de acceso autenticado; no hace falta publicar `profiles`, `voting_votes` ni `voting_ballots_cast`.
4. Después de aplicar la migración, despliega el código en Vercel con las tres variables de Supabase del apartado de configuración. No hay variables ni dependencias adicionales para Realtime. Si cambias variables, crea un nuevo despliegue.
5. Comprueba mensajes, conservación del borrador, cierre de actividades, reconexión y revelación del podio con sesiones distintas.

El navegador se conecta directamente a Supabase para Realtime; Vercel sirve la aplicación y las rutas HTTP. No se aloja un servidor WebSocket propio ni se necesitan tareas Cron para la cuenta regresiva.

## Arquitectura y archivos

```text
src/app/page.tsx                 Portada privada y carga inicial desde el servidor
src/app/login/                   Login y cierre de sesión
src/app/perfil/                  Perfil y renuncia del empleado
src/app/admin/                   Rutas y acciones administrativas protegidas
src/app/actions/                 Escrituras de actividades, votos y café
src/app/api/avatars/[id]/        Descarga privada de fotografías
src/app/api/realtime/session/    Token de acceso temporal y referencia horaria
src/app/api/dashboard/[scope]/   Lecturas autenticadas por sección
src/app/api/activities/          Lectura paginada de mensajes
src/components/live/            Conexión compartida, sincronización y revelación
src/components/activities/      Tablero, tarjetas y modal de mensajes
src/components/coffee/          Estados de aportes y clasificación
src/lib/dashboard.ts            Consultas y modelos de presentación por sección
src/lib/live.ts                 Reloj, revelación y mezcla de mensajes
src/lib/coffee.ts               Cálculo de aportes y clasificación
src/lib/supabase/               Configuración y clientes de servidor
src/lib/auth/                   Sesión, validación y fotografías
src/proxy.ts                    Renovación SSR y protección inicial de rutas
supabase/migrations/            Esquema, permisos y funciones de PostgreSQL
scripts/                        Auditoría de configuración y comprobaciones reales
tests/                          Pruebas locales y de integración optativas
```

Next.js 16.4 App Router, React 19.3, TypeScript estricto, Tailwind 4, Motion, `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.117.3 y Sharp. Las fuentes y los iconos se sirven localmente. Se conservan los modales accesibles, la navegación móvil y el podio 2–1–3.

## Seguridad

Supabase Auth conserva y verifica las contraseñas; `profiles` nunca las contiene. El backend resuelve usernames a identidades técnicas sin exponer un directorio de correos. Los clientes SSR verifican `getClaims()` y consultan el perfil y la sesión vigentes en PostgreSQL. Las cookies son HttpOnly, SameSite=Lax y Secure en producción.

Realtime obtiene un token de acceso de corta duración mediante una ruta autenticada sin caché y lo conserva en memoria, sin persistirlo en localStorage. El token de renovación y la clave administrativa permanecen en el servidor. Las lecturas HTTP comprueban la sesión y Postgres Changes utiliza los permisos de las tablas de origen.

Las operaciones administrativas vuelven a comprobar el rol en el servidor. El cliente administrativo usa `server-only`; los clientes carecen de permisos de escritura directa. Las RPC autorizadas comprueban el acceso antes de operar. RLS y permisos por columna limitan la lectura a los datos internos necesarios. Los helpers `SECURITY DEFINER` tienen `search_path` fijo y están en `dircom_private`, que debe permanecer fuera de la Data API.

Desactivar o restablecer una contraseña invalida el acceso de sesiones anteriores mediante controles en PostgreSQL, además del bloqueo de Auth cuando corresponde. Reactivar exige una nueva sesión. El JWT puede conservar validez criptográfica hasta su expiración, aunque la aplicación y sus políticas rechacen el acceso.

Una restricción diferida impide cambiar contraseñas directamente mediante Auth sin un permiso administrativo de un solo uso. Este control depende del comportamiento transaccional de Supabase Auth y debe comprobarse en la instancia real antes de producción y después de actualizar Auth; consulta las limitaciones de la guía inicial.

Las fotografías admiten JPEG, PNG y WebP de hasta 3 MiB. El servidor valida, orienta, elimina metadatos y convierte a WebP. El bucket es privado; `/api/avatars/[id]` comprueba la sesión y evita caché pública. Los empleados no acceden directamente a Storage.

## Validación y estado conocido

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

La última validación de los cambios de actualizaciones en directo, realizada el **2 de noviembre de 2026**, terminó con **53 pruebas aprobadas**, lint y TypeScript correctos. Las pruebas cubren autenticación y validación, calendario, café, permisos y RLS, cierre y recuento de votaciones, publicaciones repetidas, referencia horaria y deduplicación de mensajes.

La compilación de producción **queda sin verificar**: Turbopack falló al iniciar el proceso auxiliar de CSS, también fuera del entorno restringido. Se reprodujo el mismo error con una aplicación mínima que solo importaba Tailwind, sin código de DIRCOM. No se cambiaron la configuración de estilos ni dependencias para resolverlo. Es necesario comprobar el build del despliegue antes de considerar finalizada la activación.

Las pruebas de PostgreSQL usan PGlite con esquemas Auth/Storage simulados. No sustituyen las pruebas de autenticación, renovación de credenciales, WebSockets y políticas contra Supabase real. La suite optativa de `tests/live/` se ejecuta expresamente en staging mediante `npm run test:live`; consulta sus requisitos en la guía inicial. La prueba manual de Realtime entre navegadores queda pendiente hasta aplicar la migración y desplegar.

`npm start` sirve un build de producción existente; el HTTPS lo proporciona Vercel o el proxy del alojamiento. Para desarrollo local utiliza `npm run dev`.

[SETUP_STATUS.md](docs/SETUP_STATUS.md) conserva el registro histórico de la conexión y pruebas del 13 de octubre de 2026. Sus referencias a módulos demostrativos no describen el código actual. El procedimiento vigente para activar las actualizaciones en directo está en [LIVE_UPDATES.md](docs/LIVE_UPDATES.md).
