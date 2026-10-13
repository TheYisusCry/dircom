# Iconos locales

`material-symbols-rounded.woff2` es un subconjunto de Material Symbols Rounded servido por Google Fonts. Configuración: tamaño óptico 24, peso 500, relleno 1 y gradación 0. Se incluye su licencia Apache 2.0 en `LICENSE-material-symbols.txt`.

Origen y documentación: https://developers.google.com/fonts/docs/material_symbols

El componente común es `src/components/ui/icon.tsx`. Los controles usan la fuente de iconos; las celebraciones y actividades combinan esos símbolos con emojis a color. Los iconos decorativos se ocultan a lectores de pantalla y los botones conservan sus etiquetas accesibles.

El archivo contiene: add, arrow_forward, arrow_outward, auto_awesome, cake, calendar_month, celebration, chat_bubble, check_circle, close, coffee, emoji_events, event_upcoming, forum, groups, help, how_to_vote, location_on, lock, menu, restaurant, schedule, spa, waving_hand y workspace_premium.

Para añadir otro símbolo, descarga un subconjunto actualizado de Google Fonts con todos los nombres ordenados alfabéticamente en el parámetro `icon_names`, reemplaza el WOFF2 y añade su componente al sistema común. No se necesita conexión externa en ejecución.
