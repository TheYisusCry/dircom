# DIRCOM

Plataforma privada de equipo. La etapa 2 incorpora Supabase Auth, PostgreSQL y fotografías privadas, conservando el dashboard, Plus Jakarta Sans, los iconos locales y el verde `#439441`.

El usuario del header y del saludo procede de la sesión real. Cumpleaños destacados, reconocimientos, votaciones y actividades siguen utilizando los ejemplos de la etapa 1 y están identificados como demostrativos. No se ha implementado la etapa 3 ni desplegado la aplicación.

## Preparación y ejecución

Requisitos: Node.js **22.18 o posterior**, npm y un proyecto Supabase dedicado a DIRCOM. Desde esta carpeta:

```powershell
npm ci
Copy-Item .env.example .env.local
```

Completa `.env.local` con los valores reales del proyecto:

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto, desde **Connect**.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: clave pública del mismo proyecto.
- `SUPABASE_SERVICE_ROLE_KEY`: clave privada de servidor. El nombre previsto se conserva; acepta una clave actual `sb_secret_...` o una `service_role` heredada.

No publiques `.env.local` ni compartas la clave privada en el chat. La plantilla tiene valores vacíos; no hay conexión ni usuarios precargados.

**Sigue [la guía de Supabase](docs/SUPABASE_SETUP.md)** para desactivar el registro público, ejecutar las migraciones en orden, verificar Storage y crear el administrador. Después:

```powershell
npm run dev
```

Abre `http://localhost:3000/login`. Reinicia el servidor después de cambiar variables. Sin configuración, el login informa que el acceso está en preparación y sus controles quedan deshabilitados; no simula una sesión.

Para crear el primer administrador, configura temporalmente `DIRCOM_ADMIN_USERNAME`, `DIRCOM_ADMIN_PASSWORD`, `DIRCOM_ADMIN_FIRST_NAME` y `DIRCOM_ADMIN_LAST_NAME` y ejecuta:

```powershell
npm run bootstrap:admin
```

Retira esas cuatro variables cuando termine. El proceso manual se niega a crear un segundo administrador y no tiene endpoint HTTP. La guía incluye recuperación de emergencia de la cuenta principal desde un entorno confiable.

Ese archivo se utiliza únicamente para crear la primera cuenta. Después, las contraseñas de empleados se asignan desde **Administración → Empleados** y la del administrador desde **Administración → Mi cuenta**. Las contraseñas admiten 6–64 caracteres sin exigir mayúsculas, números ni símbolos (máximo 72 bytes por compatibilidad con Auth).

## Funciones disponibles

- `/login`: usuario y contraseña, errores genéricos, carga y limitación persistente de intentos.
- `/`: dashboard privado, perfil real, foto o avatar, cargo y cierre de sesión.
- `/admin`: resumen real de cuentas, visible únicamente para el administrador.
- `/admin/empleados`: lista paginada, alta, edición de nombre/cargo/cumpleaños/foto, contraseña nueva y activación/desactivación. No hay límite fijo de 12 cuentas.
- `/admin/cuenta`: el administrador cambia su propia contraseña desde el panel y vuelve a iniciar sesión con la nueva.
- `/acceso-denegado`: respuesta para empleados que intentan acceder al panel.
- `/api/avatars/[id]`: fotografías comprobando la sesión, sin caché pública.

Los empleados pueden consultar los campos públicos internos de perfiles activos, pero no modificarlos. No hay registro público, recuperación por correo ni cambio de contraseña por empleados. Los identificadores, usernames y roles son inmutables. La cuenta administradora principal no puede desactivarse ni eliminarse mediante estas operaciones.

## Arquitectura y archivos

```text
src/app/login/                 Login y cierre de sesión mediante Server Actions
src/app/admin/                 Rutas y acciones administrativas protegidas
src/app/api/avatars/[id]/      Descarga privada de fotos
src/components/auth/          Formulario de login
src/components/admin/         Tabla, tarjetas móviles y formularios
src/lib/supabase/              Configuración, cliente SSR y cliente administrativo
src/lib/auth/                  Sesión, validación, fotos y compensación de altas
src/proxy.ts                  Renovación SSR y protección inicial de rutas
src/types/database.ts         Tipos de perfiles, roles, RPC y acciones
supabase/migrations/          Perfiles, permisos, protección Auth y Storage
scripts/bootstrap-admin.mjs   Creación manual de la cuenta principal
scripts/recover-admin.mjs     Recuperación con permiso previo emitido en SQL
tests/                        Validación, fechas, PostgreSQL y pruebas reales optativas
```

Next.js 16.4 App Router, React 19.3, TypeScript estricto, Tailwind 4, Motion, `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.117.3 y Sharp. Las fuentes se sirven localmente. El dashboard conserva los modales accesibles, navegación móvil, podio 2–1–3, celebración y estados de votación de ejemplo. Las fotografías demostrativas deben sustituirse por imágenes autorizadas del equipo cuando se conecten esos módulos.

## Seguridad

Auth conserva y verifica las contraseñas; `profiles` nunca las contiene. El backend resuelve usernames a identidades técnicas aleatorias sin exponer un directorio de correos. Los clientes SSR verifican `getClaims()` y después consultan el perfil y la sesión vigentes en PostgreSQL. Las cookies son HttpOnly, SameSite=Lax y Secure en producción. No se guarda manualmente ningún token en localStorage; no se necesita un cliente Auth de navegador porque el acceso funciona mediante acciones de servidor.

Las operaciones administrativas vuelven a comprobar el rol en el servidor. El cliente privado usa `server-only`; los roles de cliente carecen de permisos de escritura. RLS y permisos por columna permiten únicamente los datos internos necesarios. Los helpers `SECURITY DEFINER` tienen `search_path` fijo y se encuentran en `dircom_private`, que debe permanecer fuera de la Data API. Las funciones públicas son wrappers con permisos explícitos.

Desactivar o restablecer una contraseña invalida el acceso de sesiones anteriores mediante un corte temporal en la base de datos, además del bloqueo de Auth cuando corresponde. El JWT puede seguir siendo criptográficamente válido hasta su expiración; las políticas y la aplicación ya rechazan su acceso. Reactivar exige una nueva sesión.

Una restricción diferida de PostgreSQL impide cambiar contraseñas directamente a través de Auth sin un permiso administrativo de un solo uso. **Este control depende del comportamiento transaccional de Supabase Auth y requiere probarse en la instancia real antes de producción y después de actualizar Auth.** También bloquea cambios automáticos del hash por futuras migraciones de Auth; consulta las limitaciones de la guía.

Las fotos admiten JPEG, PNG y WebP de hasta 3 MiB. El servidor decodifica, valida, orienta y convierte a WebP, elimina metadatos y organiza archivos por UUID. El bucket es privado y solo el backend accede a los archivos. Los empleados ven las imágenes de perfiles activos mediante `/api/avatars/[id]`, que comprueba la sesión en cada solicitud y evita caché pública. No tienen permisos de descarga directa ni de subida a Storage.

## Validación

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Las pruebas locales comprueban fechas, usernames, fortaleza de contraseña, campos editables, recuperación ante altas parciales, RLS y permisos en PostgreSQL real mediante PGlite. El esquema Auth/Storage de esa prueba es una representación local: no sustituye las llamadas HTTP a Supabase.

La suite real está en `tests/live/supabase.test.mjs`. Se activa expresamente en **staging**, crea un empleado temporal y elimina solo sus propios registros al terminar. Configuración y pruebas manuales de rutas en [la guía](docs/SUPABASE_SETUP.md#7-validación-con-supabase-real).

El resultado de conectar el proyecto real y los pasos todavía pendientes se registran en [SETUP_STATUS.md](docs/SETUP_STATUS.md). Las comprobaciones de configuración no sustituyen las pruebas de login, operaciones administrativas y fotografías. `npm start` sirve el build de producción por HTTPS detrás de un proxy; para desarrollo local utiliza `npm run dev`.

La revisión de dependencias conserva cinco avisos altos en la cadena de herramientas de desarrollo `eslint-config-next → fast-glob → micromatch → braces`, sin una corrección compatible disponible durante la revisión. No se ha aplicado `npm audit fix --force`.
