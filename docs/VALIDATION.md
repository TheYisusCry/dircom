# Verificación de la etapa 2

Fecha: 13 de octubre de 2026. Entorno local Windows, Node.js 26.3, sin variables de conexión Supabase.

Esta es la verificación inicial antes de configurar credenciales. Para el resultado posterior con la cuenta real y las pruebas alojadas, consulta [SETUP_STATUS.md](SETUP_STATUS.md).

- `npm run lint`: correcto.
- `npm run typecheck`: correcto. La generación de tipos de Next.js requirió permisos normales de la cuenta para resolver OneDrive; dentro del aislamiento SWC recibió acceso denegado.
- `npm run build`: correcto; rutas de aplicación dinámicas y proxy generados.
- `npm test`: **34 pruebas aprobadas**, cero fallos. Incluye 17 escenarios anidados de permisos/migraciones en PGlite, validadores, compensación de altas y calendario.
- `node --test tests/live/supabase.test.mjs`: **1 suite omitida**, sin credenciales ni activación explícita. No representa éxito de integración remota.
- `node --check scripts/recover-admin.mjs`: correcto. Sin configuración el script falla de forma segura y no contacta Auth.
- `git diff --check`: correcto.

Consultas HTTP locales sin sesión:

- `/`, `/admin`, `/admin/empleados`: **307 → /login**, `private, no-store`.
- `/api/avatars/00000000-0000-0000-0000-000000000000`: **401**, `private, no-store`.
- `/login`: **200**, `no-store`; formulario deshabilitado hasta configurar Supabase.

Login revisado visualmente a 1280 × 900 y 375 × 812. En móvil el ancho del contenido y el viewport son 375 píxeles, sin desbordamiento horizontal. Capturas: `login-stage2.png` y `login-stage2-mobile.png` en la raíz del proyecto.

La base local representa los esquemas propiedad de Supabase para comprobar PostgreSQL/RLS; no ejecuta el servicio GoTrue ni Storage HTTP. Quedan pendientes login real, compatibilidad de triggers con la instancia alojada, operaciones administrativas, descarga/subida real y revisión del panel autenticado. Sigue [la guía de configuración y pruebas](SUPABASE_SETUP.md).
