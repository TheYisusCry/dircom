# Configuración de Supabase para DIRCOM — etapa 2

Esta guía enumera lo que debes configurar en Supabase y en tu equipo. Consulta [el estado de ejecución](SETUP_STATUS.md) para distinguir los pasos completados de los pendientes; este documento no contiene credenciales.

## 1. Elegir el proyecto

Usa un proyecto nuevo dedicado a DIRCOM, inicialmente de pruebas. Si quieres utilizar uno existente, revisa primero sus tablas, triggers de Auth, permisos y políticas de Storage y haz una copia de seguridad. Estas migraciones no eliminan ni reemplazan tablas existentes: fallan si ya existen `public.profiles`, `dircom_private` o el bucket `dircom-avatars`.

No borres objetos para resolver una colisión. Adapta la migración a esa base después de revisar sus datos. No ejecutes `db reset` en una instancia remota.

## 2. Configurar Authentication

En **Authentication → Sign In / Providers**:

1. Desactiva **Allow new users to sign up**.
2. Desactiva **Allow anonymous sign-ins** y **Allow manual linking**.
3. Mantén **Email** habilitado para autenticación con contraseña. Los correos son identidades internas generadas por el servidor, no datos personales ni campos del formulario.
4. Mantén **Confirm Email** activado. Las altas administrativas usan `email_confirm: true`: no envían ni requieren confirmación por correo.
5. Deja desactivados Phone, Google y los demás proveedores externos; tampoco habilites passkeys u otros métodos de acceso para esta etapa.

La aplicación no utiliza invitaciones por email, magic links ni recuperación por email. No necesita SMTP; las identidades terminan en `@auth.dircom.invalid` y no reciben mensajes. Deja desactivadas las notificaciones por email de cambios de contraseña. Las cuentas se crean únicamente mediante el script inicial o el panel administrativo.

En **Authentication → URL Configuration**:

- Para desarrollo, establece **Site URL** en `http://localhost:3000`.
- Este acceso por contraseña no necesita callback OAuth ni redirect de correo. No añadas dominios ni comodines que no vayas a utilizar.
- Al desplegar, cambia Site URL a la URL HTTPS real de tu instalación.

Conserva activada la protección de reutilización/rotación de refresh tokens en los ajustes de sesión. Si tu panel permite configurar la vigencia del JWT, una duración de 15 minutos reduce el tiempo de validez criptográfica de un token antiguo; el rechazo de acceso de DIRCOM se realiza además en PostgreSQL en cada consulta protegida.

Estas opciones y su ubicación están documentadas por [Supabase Authentication](https://supabase.com/docs/guides/auth/general-configuration). Desactivar registro en Supabase es necesario aunque la aplicación no tenga `/register`.

## 3. Copiar las variables a tu equipo

Desde la carpeta `dircom`, crea `.env.local` si aún no existe:

```powershell
Copy-Item .env.example .env.local
```

En el diálogo **Connect** copia la URL y la clave pública. En **Settings → API Keys** copia una clave privada del mismo proyecto. Completa estas tres variables, sin espacios alrededor del `=`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

La clave pública actual empieza con `sb_publishable_`. Para la variable privada, prefiere una clave actual `sb_secret_`; también se admite la clave heredada `service_role` si tu proyecto todavía la usa. El nombre `SUPABASE_SERVICE_ROLE_KEY` se conserva por compatibilidad con la especificación y es siempre exclusivo del servidor. El SDK envía las claves según el mecanismo de Supabase; no las trates manualmente como JWT. [Referencia oficial de claves](https://supabase.com/docs/guides/getting-started/api-keys).

No copies una contraseña de PostgreSQL como clave API. `.env.local` está ignorado por Git. Coloca la clave privada directamente en ese archivo o en el gestor de secretos del despliegue; no la pegues en conversaciones, componentes cliente, URLs o capturas.

En **Data API → Exposed schemas**, conserva `public` y los esquemas estándar necesarios de tu proyecto. **No expongas `dircom_private` ni `auth`.** No amplíes permisos de tablas para resolver errores del cliente: el acceso de empleados está restringido por columna y por RLS intencionalmente.

## 4. Ejecutar las migraciones

En **SQL Editor → New query**, abre y pega el contenido completo de cada archivo, en este orden. Ejecuta uno y confirma que termina correctamente antes de pasar al siguiente:

1. [`202610130001_stage2.sql`](../supabase/migrations/202610130001_stage2.sql): perfiles, directorio interno, restricciones, RLS, sesiones, límites de intentos, protección del administrador y permisos de cambio de contraseña.
2. [`202610130002_avatars.sql`](../supabase/migrations/202610130002_avatars.sql): bucket y política de lectura de fotografías.
3. [`202610130003_admin_password.sql`](../supabase/migrations/202610130003_admin_password.sql): permite al administrador cambiar su propia contraseña desde **Mi cuenta**, mediante una acción de servidor. Si las dos primeras ya están aplicadas, ejecuta únicamente esta tercera.
4. [`202610130004_server_avatar_reads.sql`](../supabase/migrations/202610130004_server_avatar_reads.sql): deshabilita descargas directas de Storage por clientes. Las fotos se sirven únicamente mediante la ruta autenticada de DIRCOM. Si las anteriores ya están aplicadas, ejecuta únicamente esta cuarta.

Cada archivo incluye su propia transacción. No repitas un archivo que ya terminó correctamente. Si falla, guarda el mensaje del SQL Editor sin credenciales; no elimines tablas ni desactives protecciones para hacer que pase. Estas migraciones se ejecutan con la cuenta confiable del SQL Editor, no con el rol `authenticated`.

Puedes comprobar lo creado con esta consulta de solo lectura:

```sql
select schemaname, tablename, rowsecurity
from pg_tables where schemaname = 'public' and tablename = 'profiles';

select schemaname, tablename, policyname, roles, cmd
from pg_policies
where (schemaname = 'public' and tablename = 'profiles')
   or (schemaname = 'storage' and policyname like 'dircom_%');

select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'dircom-avatars';
```

`profiles.rowsecurity` debe ser `true`. La política del directorio debe ser solo SELECT para autenticados. No se crean tablas de votos, actividades, mensajes ni eventos de cumpleaños en esta etapa.

Los archivos son migraciones versionadas. Si los ejecutas mediante el SQL Editor, no uses después `supabase db push` sin conciliar primero el historial de migraciones: el CLI no sabe automáticamente que ejecutaste SQL a mano.

## 5. Revisar Storage

La segunda migración crea **dircom-avatars**. No lo crees antes manualmente.

En **Storage → dircom-avatars** comprueba:

- **Public bucket** desactivado.
- Tamaño máximo **3 MiB**, es decir **3145728 bytes**.
- MIME permitidos `image/jpeg`, `image/png`, `image/webp`.
- Ninguna política SELECT, INSERT, UPDATE o DELETE para `anon` o `authenticated` que conceda acceso a este bucket. La cuarta migración retira la política inicial de lectura directa; no elimina fotos ni el bucket.

En un proyecto compartido, revisa también políticas generales de `storage.objects`: una política anterior amplia puede conceder acceso aunque esta migración sea restrictiva. Por eso se recomienda un proyecto dedicado. [Storage y RLS](https://supabase.com/docs/guides/storage/security/access-control).

Las subidas se hacen desde el panel, mediante acciones protegidas de servidor. El archivo se valida por contenido, no solo por extensión, se limita a 20 millones de píxeles y una sola imagen, y se transforma a WebP de hasta 600 píxeles con metadatos eliminados. Ruta: `UUID_DEL_EMPLEADO/UUID_DEL_ARCHIVO.webp`.

Las fotos se sirven por `/api/avatars/[id]`, comprobando sesión y permisos, con `Cache-Control: private, no-store`. No se utilizan URLs públicas ni URLs firmadas que sigan dando acceso después de desactivar una cuenta. La lectura de empleados está limitada a las fotos actuales de perfiles activos; el administrador puede ver empleados desactivados en su panel.

El acceso directo al bucket queda reservado al backend. Las pruebas reales detectaron una respuesta de foto reutilizada tras desactivar un usuario cuando se permitía la descarga directa. El CDN puede conservar respuestas previamente autorizadas; cambiar RLS no equivale a purgar su caché. Por eso la autorización actual se comprueba en DIRCOM antes de pedir los bytes al almacenamiento. [Caché de Storage](https://supabase.com/docs/guides/storage/cdn/fundamentals), [Smart CDN](https://supabase.com/docs/guides/storage/cdn/smart-cdn).

## 6. Crear el administrador e iniciar la aplicación

En `.env.local` completa temporalmente:

```dotenv
DIRCOM_ADMIN_USERNAME=
DIRCOM_ADMIN_PASSWORD=
DIRCOM_ADMIN_FIRST_NAME=
DIRCOM_ADMIN_LAST_NAME=
```

El username admite 3–32 caracteres ASCII, empieza por letra y permite letras, números, punto, guion y guion bajo; se normaliza a minúsculas. La contraseña admite 6–64 caracteres, sin exigir mayúsculas, números ni símbolos, y no más de 72 bytes UTF-8. En Supabase configura el mínimo a **6** y deja vacíos los requisitos de composición. Si contiene `#`, encierra el valor completo entre comillas en el archivo dotenv para que no se interprete como comentario.

Desde la carpeta `dircom`:

```powershell
npm run bootstrap:admin
```

El script verifica que no existe un administrador, crea la identidad técnica con Auth y el perfil administrador en la misma transacción de Auth, y confirma que está activo. Si el perfil falla, esa transacción se revierte. La base de datos impide crear administradores simultáneos/duplicados.

Después:

1. Retira las cuatro variables `DIRCOM_ADMIN_*` de `.env.local`.
2. En **Table Editor → profiles** comprueba que existe una fila con el username elegido, `role = admin` e `is_active = true`.
3. En **Authentication → Users** verás una identidad técnica, no tu correo personal. No crees empleados manualmente desde esta pantalla: faltaría el payload de perfil del flujo de DIRCOM.
4. Ejecuta `npm run dev`, o reinícialo si estaba abierto.
5. Abre `http://localhost:3000/login` y entra usando exclusivamente tu username y contraseña.
6. Desde **Panel administrativo → Empleados**, crea las cuentas reales. No se convierten automáticamente los 12 empleados ficticios en usuarios.

Las variables `DIRCOM_ADMIN_*` sirven solo para esa creación inicial. A partir de ahí, asigna y restablece contraseñas de empleados desde **Empleados**. Para la del administrador, abre **Mi cuenta**: no requiere editar `.env.local` ni ejecutar SQL. Después de guardarla, vuelve a iniciar sesión con la nueva contraseña. El procedimiento SQL de emergencia del paso 9 queda reservado para pérdida de acceso.

El cumpleaños guarda solo día y mes, admite el 29 de febrero y exige ambos campos o ninguno. La fecha de celebración pertenece a otra etapa. En edición no se cambia username, UUID ni rol.

Si una operación falla por pérdida de conexión, comprueba el estado en el panel antes de repetirla: una respuesta perdida no demuestra que la operación remota se haya revertido. Una alta con foto fallida intenta eliminar exclusivamente su nueva cuenta; si esa limpieza falla, intenta dejarla desactivada y comunica que necesita revisión. La creación Auth/perfil es atómica, pero Storage y red son operaciones separadas.

## 7. Validación con Supabase real

PGlite ejecuta las migraciones reales sobre una representación local de los esquemas Auth y Storage; **no verifica el comportamiento del servicio Auth alojado**. Las pruebas contra tu instancia real y sus resultados se registran en [SETUP_STATUS.md](SETUP_STATUS.md).

En un proyecto de **staging** ya migrado y con administrador, agrega temporalmente a `.env.local`:

```dotenv
DIRCOM_RUN_LIVE_TESTS=yes
DIRCOM_TEST_ADMIN_USERNAME=
DIRCOM_TEST_ADMIN_PASSWORD=
```

Ejecuta:

```powershell
npm run test:live
```

Para comprobar también la ruta de fotos, mantén DIRCOM en ejecución (`npm run dev`). La suite usa `http://localhost:3000`; si necesitas otra dirección de esta misma app en staging, define `DIRCOM_TEST_APP_URL` con esa URL.

La suite de configuración comprueba, sin modificar datos ni necesitar un administrador, que el registro está cerrado y los visitantes no leen perfiles ni acceden a RPC privadas. La suite de usuarios inicia una sesión del administrador, crea un empleado temporal con nombre aleatorio, comprueba login correcto/incorrecto, duplicados, RLS, intento de elevar rol, cambio propio de contraseña rechazado, restablecimiento administrativo, sesiones antiguas, bloqueo/reactivación y Storage privado. Al terminar cierra únicamente sus propias sesiones y elimina únicamente su cuenta/foto temporal. Si falla la limpieza, revisa ese fixture en staging. Retira las variables de pruebas cuando termines. Una suite marcada `SKIP` no cuenta como integración aprobada.

Además, verifica desde la interfaz en dos sesiones separadas:

1. Sin sesión, `/`, `/admin` y `/admin/empleados` redirigen a `/login`; una foto privada no se descarga.
2. El administrador ve su nombre/cargo reales, entra al panel y crea un empleado con foto.
3. El empleado entra al dashboard y el intento de abrir `/admin` muestra acceso denegado. No aparecen acciones de edición ni cambio de contraseña.
4. Editar cargo y cumpleaños se refleja en el panel; fechas inválidas y usernames duplicados se rechazan.
5. Desactivar al empleado bloquea su sesión ya abierta y nuevos accesos. Su foto tampoco puede descargarse con esa sesión.
6. Reactivar requiere volver a iniciar sesión. Restablecer contraseña rechaza sesiones previas y la contraseña anterior.
7. El cierre de sesión lleva a `/login`; volver a una ruta privada no restaura acceso.
8. Revisa escritorio y móvil, foto predeterminada y carga/errores de formularios.

No publiques antes de completar estas verificaciones. No se ha revisado visualmente un panel con una sesión real sin conexión a Supabase.

## 8. Controles y límites que debes conservar

- **Rol:** se consulta desde la base de datos en cada operación administrativa; ningún role enviado por el navegador concede permisos.
- **RLS:** el helper consulta perfiles y sesiones en un esquema privado, evitando recursión. Los empleados solo leen campos internos autorizados de perfiles activos. La RPC propia devuelve únicamente el perfil del solicitante vigente.
- **Sesión:** `@supabase/ssr` y `src/proxy.ts` actualizan cookies. La aplicación verifica `getClaims()` más el perfil y `auth.sessions`. Cookies HttpOnly/Lax y Secure en producción; no hay almacenamiento manual de tokens en localStorage. [Flujo SSR oficial](https://supabase.com/docs/guides/auth/server-side/nextjs).
- **Revocación:** cambiar contraseña o estado mueve un corte temporal. Las sesiones anteriores dejan de cumplir RLS, incluso después de reactivar. Un JWT antiguo puede conservar su firma válida hasta expirar, pero no acceso efectivo a datos. Los clientes administrativos con clave privada omiten RLS y siempre deben permanecer en el servidor.
- **Intentos:** ventana de 15 minutos, máximo 8 por username, 30 por IP confiable y 200 globales; se cuentan también accesos correctos. Las claves de username/IP se almacenan como HMAC, sin contraseñas. En Vercel se utiliza su cabecera de IP confiable. En otros entornos se agrupan conservadoramente las IP bajo una clave común: si despliegas detrás de otro proxy, configura una fuente de IP que ese proxy garantice y ajusta los límites a la oficina. No confíes directamente en una cabecera pública manipulable. Los errores son genéricos y tienen una duración mínima aproximada de 900 ms; no se promete eliminar toda diferencia de tiempo.
- **Contraseñas:** la restricción diferida en `auth.users` exige un nonce privado de un solo uso y tres minutos. Los empleados no pueden emitirlo ni editar `app_metadata`; la verificación se hace al confirmar la transacción, después de que Auth escriba contraseña y metadata. El hashing sigue siendo el nativo de Supabase.
- **Compatibilidad de Auth:** esta defensa usa triggers sobre tablas administradas por Supabase, y depende de que la creación/actualización administrativa conserve la transacción que usa el [código de GoTrue revisado](https://github.com/supabase/auth/blob/master/internal/api/admin.go). Ejecuta la suite real antes de producción y tras cambios del servicio. También rechaza una reescritura automática de `encrypted_password` sin permiso: una futura migración de hashing requiere planificar una adaptación y probarla en staging. No desactives el trigger para resolver un fallo de login.
- **Administración principal:** la cuenta no puede eliminarse, desactivarse ni cambiar de username/rol. Su contraseña se cambia desde **Mi cuenta**. El servidor obtiene el id de la sesión administradora; ningún id enviado por el formulario elige qué cuenta actualizar. Si se pierde el acceso, utiliza el procedimiento de emergencia inferior.

## 9. Recuperación de emergencia del administrador

Solo para quien controla el proyecto Supabase y el servidor. No existe recuperación pública por correo. No desactives la protección ni elimines al administrador para crear otro.

En el **SQL Editor** confiable ejecuta esta autorización limitada a la cuenta principal:

```sql
insert into dircom_private.password_updates (user_id, nonce, expires_at)
select user_id, gen_random_uuid(), clock_timestamp() + interval '3 minutes'
from dircom_private.primary_administrator
on conflict (user_id) do update
set nonce = excluded.nonce, expires_at = excluded.expires_at
returning user_id, nonce;
```

En `.env.local` agrega temporalmente el `user_id` y `nonce` devueltos y la contraseña nueva:

```dotenv
DIRCOM_RECOVERY_ADMIN_ID=
DIRCOM_RECOVERY_NONCE=
DIRCOM_RECOVERY_PASSWORD=
```

Antes de tres minutos ejecuta:

```powershell
node --env-file=.env.local scripts/recover-admin.mjs
```

El script comprueba un perfil administrador activo y usa la API administrativa nativa con el permiso ya emitido. No imprime la contraseña. Si el permiso caduca, emite otro con el mismo SQL. Un permiso consumido no puede reutilizarse. Después retira las tres variables, guarda la nueva contraseña y vuelve a iniciar sesión: las sesiones anteriores pierden acceso a DIRCOM.

## 10. Despliegue futuro en Vercel

Esta tarea no despliega. Cuando corresponda, configura las tres variables de conexión del paso 3 en el proyecto Vercel y realiza un nuevo deploy; las variables `NEXT_PUBLIC_*` se incorporan durante el build. No subas variables de bootstrap, recuperación o pruebas a Vercel. Usa la URL HTTPS real como Site URL. Mantén separados los proyectos y claves de staging/producción y revisa Security Advisor sin ampliar permisos por comodidad.

Cumpleaños destacados, votos y actividades permanecen demostrativos. La siguiente etapa podrá conectarlos tras validar este acceso y la administración de empleados.
