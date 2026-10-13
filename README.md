# DIRCOM

Primera etapa de una plataforma social interna para 12 empleados y un administrador. Dashboard en español con datos ficticios, sin autenticación, conexión a Supabase ni votaciones funcionales. No se ha publicado ni desplegado.

## Ejecutar localmente

Requisitos: Node.js **22.18 o posterior** y npm. Desde esta carpeta:

```powershell
npm ci
npm run dev
```

Abre http://localhost:3000. Si ese puerto está ocupado, utiliza la dirección que imprima Next.js.

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`npm start` sirve el último build de producción. En el entorno aislado de Windows, SWC puede requerir ejecutar la compilación con permisos normales de la cuenta para resolver rutas de OneDrive.

## Tecnologías

Next.js 16.4 (App Router), React 19.3, TypeScript estricto, Tailwind CSS 4 y Motion. Plus Jakarta Sans variable se sirve localmente mediante `next/font/local`, desde el paquete Fontsource. Los iconos usan Material Symbols Rounded en una fuente local de 13 KB, junto con emojis a color para los elementos de celebración. No requieren peticiones a Google Fonts en ejecución o compilación. Las dependencias añadidas tienen versiones exactas y `package-lock.json` fija el árbol completo.

## Estructura

```text
src/
  app/                 Página principal, layout, estilos y favicon SVG
  assets/fonts/        Fuente local de iconos y licencia
  components/
    layout/            Header, navegación responsive y contenedor
    birthdays/         Cumpleaños destacado e invitación
    employees/         Reconocimiento semanal
    voting/            Podio y cinco estados de presentación
    activities/        Tablero, tarjetas, mensajes y vista de formulario
    ui/                Iconos, botón, avatar, modal, encabezado y estado vacío
  data/mock-data.ts    Única fuente de los datos ficticios
  lib/dates.ts         Fechas recurrentes y formato en español
  types/index.ts       Modelos de presentación tipados
public/images/         Fotografías locales de muestra
tests/dates.test.mjs    Casos relevantes del calendario
```

La página, el layout y los bloques estáticos son Server Components. Los Client Components se limitan a navegación, modales, saludo por horario y selección de estados de ejemplo. Los componentes reciben modelos de presentación; no dependen de un cliente de base de datos.

El saludo inicial recibe el mismo perfil de ejemplo que el header mediante `UserGreeting`. Después de hidratar, utiliza la hora real en Bolivia: buenos días de 06:00 a 11:59, buenas tardes de 12:00 a 18:59 y buenas noches el resto del día. Se actualiza cada minuto. El HTML inicial usa un saludo neutro para evitar diferencias entre servidor y navegador. En la etapa de autenticación, el perfil se sustituirá por el usuario de la sesión. La identidad utiliza `#439441` como verde principal y variantes de texto con mayor contraste para las etiquetas pequeñas.

La composición visual utiliza tarjetas claras sobre un fondo cálido, saludo en una banda verde suave y cumpleaños en una tarjeta horizontal con fotografía y panel de fecha. El reconocimiento muestra al ganador sin motivo ni cita. El Top 3 combina fotografías, corona, medallas y un podio con alturas distintas en orden visual 2–1–3. La entrada del podio respeta la preferencia de movimiento reducido. Las actividades muestran los mensajes en bloques de conversación. En móvil, los paneles se apilan y la navegación se convierte en menú.

## Interacciones disponibles

- Navegación por secciones, menú móvil y enlace para saltar al contenido.
- Apertura y cierre de invitación, conversaciones y formulario de ejemplo.
- Modales con `dialog` nativo, navegación por teclado, Escape, cierre al pulsar fuera, foco contenido y retorno al control original. El scroll del documento se bloquea mientras están abiertos.
- Exploración de votación programada, abierta, voto registrado, finalizada y resultado publicado. Cambiar la vista no emite votos.
- Animación discreta de apertura que respeta la preferencia de movimiento reducido.

Los formularios de publicación y mensajes están deshabilitados e indican qué integración requieren. No hay simulaciones de guardado, contadores de participación, estadísticas administrativas ni registros públicos. El perfil del header también es ficticio.

## Datos y fechas

El calendario de ejemplo representa el **13 de octubre de 2026**, mediante `DEMO_DATE`; es una instantánea fija. El saludo utiliza la hora real, mientras los cumpleaños, eventos y rondas siguen siendo datos ficticios. Para sustituirlos, edita `src/data/mock-data.ts`. Hay 12 empleados ficticios. Los retratos son fotografías de muestra y no representan empleados reales.

`Employee.birthday` contiene exclusivamente día y mes. `BirthdayCelebration` contiene empleado asociado, título, invitación larga, imagen opcional, lugar e instante ISO con zona horaria. El cumpleaños de Mía es el **18 de octubre**; su celebración es el **16 de octubre de 2026 a las 17:00, hora de Bolivia**.

`getNextBirthday` selecciona exactamente una persona, incluye cumpleaños de hoy, contempla el siguiente año y mantiene un orden estable en empates. Solo asocia celebraciones del año correspondiente en `America/La_Paz`. Si no encuentra una, la invitación muestra que está por programar y no inventa lugar ni horario. Por ahora, el 29 de febrero se interpreta como el próximo 29 de febrero real; antes de producción se deberá acordar cómo celebrarlo en años no bisiestos.

## Próxima etapa con Supabase

Pendiente, sin implementar automáticamente:

- Autenticación por invitación, sin registro público; usuarios, roles y perfiles.
- PostgreSQL: empleados, celebraciones anuales separadas, rondas, votos, resultados, actividades y mensajes.
- Políticas RLS y operaciones de servidor para validar permisos. El anonimato de los votos debe preservarse en el acceso a datos, además de la interfaz.
- Restricciones de voto único por empleado y ronda, impedir voto propio, excluir al administrador, apertura/cierre y rondas por empate.
- Storage para fotografías e invitaciones, con acceso privado.
- Administración separada, gestión de empleados, historial y estadísticas solo para administrador.
- Sincronización de la revelación y podio animado, una vez definida la lógica del backend.
- Persistencia de actividades y mensajes; cierre y eliminación por creador o administrador.

No se incluye cliente Supabase ni variables de entorno porque esta etapa no los usa. Cuando corresponda, configura secretos de servidor y políticas de acceso antes de desplegar en Vercel. `robots: noindex` evita indexación; la privacidad real dependerá de la autenticación y de las políticas RLS.

## Recursos visuales y dependencias

La identidad y la composición reinterpretan el HTML de Stitch proporcionado. Las fotografías de Mía, Pedro, Ismael y la celebración proceden de Unsplash; la de Lucía procede de la referencia entregada. Sustituir todas por imágenes autorizadas del equipo antes de producción. Plus Jakarta Sans se distribuye bajo OFL a través de Fontsource.

La revisión inicial de npm informó cinco alertas de severidad alta en la cadena de desarrollo `eslint-config-next → fast-glob → micromatch → braces`. El registro consultado aún ofrece `braces@3.0.3` como versión estable y propone bajar ESLint de Next a 14; se conserva la configuración compatible de Next 16. No se aplica `npm audit fix --force`. Estas alertas deben revisarse cuando exista una versión compatible corregida.
