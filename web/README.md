# ODServa2030 Web (Astro)

Sitio estático en Astro para explorar los paquetes de trabajo del Observatorio de implementación de la Agenda 2030 en el Sistema Universitario Español. Consumimos los contenidos ya procesados desde los PDF/Markdown originales y solo mostramos el texto de cada sección junto con sus tablas y figuras.

## Requisitos

- Node.js 20+
- npm (o pnpm)
- Acceso a la carpeta `markdown/` con los ficheros proporcionados

## Flujo de trabajo

1. **Generar contenido estructurado**
   ```bash
   node scripts/extract-content.mjs
   ```
   Esto limpia y recrea:
   - `web/src/content/work-packages/*.json` con metadatos ligeros (título, recuentos, índice)
   - `web/public/data/*.json` con el contenido completo (texto, tablas y figuras) que se carga en el navegador bajo demanda
   - `web/public/assets/*` únicamente con las imágenes que en el PDF original estaban etiquetadas como `Figure`
   - `web/src/data/media-manifest.json` para reutilizar esos activos

2. **Instalar dependencias**
   ```bash
   cd web
   npm install
   ```

3. **Desarrollo**
   ```bash
   npm run dev
   ```
   Servirá el sitio en modo hot reload. El índice permite buscar paquetes (cliente) y cada detalle renderiza texto + tablas + figuras.

4. **Build y despliegue**
   ```bash
   npm run build
   npm run preview # verificación local
   ```
   El resultado queda en `web/dist/`, listo para subir al VPS (Nginx+Caddy o similar). Bastará con servir los archivos estáticos.

## Próximos pasos sugeridos

- Añadir capas de filtrado por ODS/universidad usando los metadatos del JSON.
- Integrar optimización automática de imágenes (Sharp) en el script de extracción.
- Crear endpoints API o descargas CSV para reutilizar las tablas en otros dashboards.
- Automatizar el despliegue al VPS (GitHub Actions + rsync/SSH) y añadir monitorización básica.
