# Estado de configuración de Supabase

Verificado el 13 de octubre de 2026 sobre el proyecto DIRCOM. Este registro no contiene contraseñas, tokens, claves ni correos técnicos.

## Configuración completada

- Las tres variables de conexión funcionan contra el proyecto y el CLI está vinculado a DIRCOM.
- Las migraciones 001 y 002 ya estaban aplicadas; se verificaron sin ejecutarlas otra vez. Se aplicaron 003 (contraseña del administrador en Mi cuenta) y 004 (fotos descargadas únicamente por el backend).
- Registro público, acceso anónimo y enlace manual desactivados; Email es el único proveedor habilitado. Confirmación de email activa y altas administrativas confirmadas directamente por Auth.
- Site URL `http://localhost:3000`; JWT de 900 segundos y rotación de refresh tokens activa.
- Contraseñas de mínimo **6 caracteres**, sin composición obligatoria. Se gestionan desde **Empleados** y **Mi cuenta**.
- Data API con `public` y `graphql_public`; `auth` y `dircom_private` no se exponen.
- RLS de perfiles habilitada; clientes sin escritura y solo lectura de los siete campos públicos internos autorizados. Helpers privados con propietario `postgres` y `search_path` fijo.
- Bucket `dircom-avatars` privado, 3145728 bytes, JPEG/PNG/WebP. Los clientes no leen ni escriben archivos directamente. La ruta `/api/avatars/[id]` comprueba sesión y perfil vigentes y responde sin caché.
- Cuenta real `admin`, nombre **Admin User**, creada mediante bootstrap con rol administrador y estado activo. Las cuatro variables temporales `DIRCOM_ADMIN_*` se retiraron de `.env.local`; las claves de conexión se conservaron.

## Pruebas completadas

**35 pruebas locales** aprobadas: validación, calendario, compensación de altas, migraciones, RLS, permisos y revocación de sesiones. Lint y compilación con TypeScript correctos.

**17 pruebas contra Supabase y DIRCOM reales** aprobadas, sin fallos ni omisiones (incluye dos pruebas contenedoras). Se verificaron:

- Login correcto del administrador y empleado; contraseña incorrecta rechazada.
- Creación atómica de empleado y rechazo de username duplicado.
- Acceso denegado a visitantes y a empleados en `/admin/empleados` y `/admin/cuenta`.
- Imposibilidad de modificar roles y de cambiar contraseñas desde un cliente empleado.
- Emisión/cancelación del permiso de contraseña de administrador únicamente mediante el backend.
- Restablecimiento de contraseña de empleado y rechazo de su sesión anterior.
- Descarga real de WebP mediante la ruta de la app; rechazo sin sesión, sin escritura cliente y sin descarga directa al bucket.
- Desactivación: sesión anterior, nueva autenticación y descarga de fotos rechazadas. Reactivación: exige sesión nueva.

Se crearon y eliminaron exclusivamente cuentas/fotos temporales de prueba. La cuenta administradora real y su contraseña se conservaron.

## Revisión de interfaz

Login con `admin` completado en el navegador: saludo y header muestran el perfil real. Panel, lista de cuentas, formulario de alta y Mi cuenta revisados con sesión administradora. Campos de contraseña con mínimo 6 caracteres.

Mi cuenta revisada a 375 × 812 y administración en escritorio. Se corrigió el espaciado del header móvil; el ancho del contenido coincide con el viewport, sin desplazamiento horizontal.

El cambio efectivo de contraseña del administrador desde su formulario queda para el usuario; se verificaron su interfaz, autorización en Supabase y comportamiento de revocación en PostgreSQL local. No se modificó esa contraseña para comprobar el formulario.

## Uso y alcance

Ya se puede entrar a `/login` y crear empleados desde `/admin/empleados`. La contraseña del administrador se cambia en `/admin/cuenta`. No hace falta editar variables ni ejecutar SQL para la gestión cotidiana.

Cumpleaños destacados, reconocimientos, votos y actividades siguen demostrativos y están identificados como tales. No se implementó la etapa 3 ni se desplegó el sitio.

La configuración está en `supabase/config.toml`; la consulta de revisión en `supabase/check-stage2.sql`; el diagnóstico sin secretos en `scripts/audit-supabase.mjs`. Para repetir pruebas reales, utiliza las variables privadas `DIRCOM_TEST_ADMIN_*` explicadas en la guía y mantén la aplicación en ejecución.
