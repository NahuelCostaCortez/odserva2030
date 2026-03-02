# Guía del Proyecto ODServa2030

## Resumen Ejecutivo

**ODServe2030** es un observatorio web que presenta informes sobre la implementación de la Agenda 2030 (ODS) en el sistema universitario español. El sitio permite navegar por diferentes "paquetes de trabajo" (work packages) que contienen secciones jerárquicas, tablas y figuras extraídas de documentos PDF.

---

## Stack Tecnológico

| Tecnología | Propósito |
|------------|-----------|
| **Astro 5.x** | Framework principal (SSG - Static Site Generator) |
| **TypeScript** | Tipado estático para scripts |
| **marked** | Parser de Markdown a HTML |
| **CSS custom** | Estilos sin framework externo |

### Comandos Principales

```bash
npm install      # Instalar dependencias
npm run dev      # Servidor de desarrollo (localhost:4321)
npm run build    # Build de producción
npm run preview  # Previsualizar build
```

---

## Estructura de Directorios

```
web/
├── astro.config.mjs          # Configuración de Astro
├── package.json              # Dependencias y scripts
├── tsconfig.json             # Configuración TypeScript
├── public/
│   ├── assets/               # Imágenes organizadas por paquete
│   │   └── o1/               # Assets del paquete o1
│   │       └── _page_XX_Figure_Y.jpeg
│   └── data/                 # JSON con datos completos de cada paquete
│       └── o1.json           # Secciones, tablas y figuras
├── src/
│   ├── components/
│   │   ├── Layout.astro      # Layout base con <head> y estilos globales
│   │   └── SectionContent.astro  # Renderizador de secciones
│   ├── content/
│   │   ├── config.ts         # Definición de colecciones de contenido
│   │   └── work-packages/    # Metadatos de paquetes de trabajo
│   │       └── o1.json       # Entry de contenido (slug, título, etc.)
│   ├── data/
│   │   └── media-manifest.json  # Manifiesto de medios
│   ├── pages/
│   │   ├── index.astro       # Página principal
│   │   └── paquetes/
│   │       └── [slug].astro  # Página dinámica de detalle de paquete
│   └── scripts/
│       └── package-viewer.ts # Script cliente para cargar y renderizar
└── guia_proyecto.md          # Este documento
```

---

## Arquitectura de Contenido

### Sistema de Colecciones (Content Collections)

El proyecto usa las **Content Collections** de Astro para gestionar los paquetes de trabajo:

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const workPackages = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    dataPath: z.string(),
    heroImage: z.string().optional(),
    order: z.number().optional(),
  }),
});

export const collections = { 'work-packages': workPackages };
```

### Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│  BUILD TIME (Astro)                                             │
├─────────────────────────────────────────────────────────────────┤
│  1. Lee src/content/work-packages/*.json (metadatos)            │
│  2. Genera páginas estáticas en /paquetes/[slug]                │
│  3. Inyecta estructura HTML de secciones (vacías)               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  RUNTIME (Cliente)                                              │
├─────────────────────────────────────────────────────────────────┤
│  1. package-viewer.ts lee data-path del contenedor              │
│  2. Fetch a public/data/{slug}.json                             │
│  3. Procesa placeholders {{TABLE:...}} y {{FIGURE:...}}         │
│  4. Convierte Markdown a HTML con marked                        │
│  5. Inyecta contenido en [data-section-content]                 │
└─────────────────────────────────────────────────────────────────┘
```

### Estructura del JSON de Datos

```json
{
  "sections": [
    {
      "id": "o1-section-1",
      "slug": "introduccion",
      "title": "Introducción",
      "level": 1,
      "content": "Markdown con {{TABLE:o1-table-1}} y {{FIGURE:o1-figure-1}}"
    }
  ],
  "tables": [
    {
      "id": "o1-table-1",
      "sectionId": "o1-section-1",
      "label": "Tabla 1: Ejemplo",
      "headers": ["Columna 1", "Columna 2"],
      "rows": [["dato 1", "dato 2"]]
    }
  ],
  "figures": [
    {
      "id": "o1-figure-1",
      "sectionId": "o1-section-1",
      "src": "/assets/o1/_page_10_Figure_2.jpeg",
      "page": 10,
      "caption": "Descripción de la figura"
    }
  ]
}
```

---

## Componentes Principales

### Layout.astro

Layout base que incluye:
- Meta tags SEO
- Fuentes de Google (Inter)
- Estilos globales CSS
- Navegación responsive
- Footer

### SectionContent.astro

Renderiza cada sección con estilos según nivel jerárquico:

| Nivel | Etiqueta original | Estilo CSS |
|-------|-------------------|------------|
| 1 | `<h1>` | Título de capítulo, sin tarjeta, solo separador |
| 2 | `<h2>` | Sección principal, borde izquierdo azul |
| 3 | `<h3>` | Subsección, estilo tarjeta con sombra |

```astro
---
const { section } = Astro.props;
const levelClass = `level-${section.level}`;
---
<section id={section.slug} class={`section-block ${levelClass}`}>
  <div class="section-heading"><h2>{section.title}</h2></div>
  <div class="section-content" data-section-content></div>
</section>
```

### package-viewer.ts

Script cliente que:
1. Busca `#package-sections` y lee `data-package-path`
2. Fetch del JSON correspondiente
3. Procesa cada sección:
   - Reemplaza placeholders de tablas/figuras
   - Convierte Markdown a HTML
4. Funciones auxiliares:
   - `createTableHTML(table)`: Genera HTML de tabla
   - `createFigureHTML(figure)`: Genera HTML de figura
   - `processContentPlaceholders()`: Reemplaza `{{TABLE:...}}` y `{{FIGURE:...}}`

---

## Sistema de Placeholders

Las tablas y figuras se incrustan mediante placeholders en el contenido Markdown:

```
{{TABLE:o1-table-1}}   → Se reemplaza por la tabla con id "o1-table-1"
{{FIGURE:o1-figure-1}} → Se reemplaza por la figura con id "o1-figure-1"
```

### Renderizado de Tablas

```html
<div class="table-block">
  <p class="table-label">Tabla 1: Descripción</p>
  <div class="table-wrapper">
    <table>
      <thead><tr><th>Header</th></tr></thead>
      <tbody><tr><td>Dato</td></tr></tbody>
    </table>
  </div>
</div>
```

### Renderizado de Figuras

```html
<figure>
  <img src="/assets/o1/_page_10_Figure_2.jpeg" alt="Caption" loading="lazy">
  <figcaption>
    <span>Caption</span>
    <span class="page-chip">Pág. 10</span>
  </figcaption>
</figure>
```

---

## Páginas

### index.astro (Homepage)

- Hero section con título y descripción
- Buscador de paquetes (filtro en tiempo real)
- Grid de tarjetas de paquetes de trabajo
- Estadísticas del observatorio

### [slug].astro (Detalle de Paquete)

- Header con título y descripción del paquete
- TOC (Table of Contents) sticky en desktop
- Contenedor `#package-sections` con `data-package-path`
- Navegación entre secciones con scroll suave

---

## Estilos CSS

### Variables Globales (en Layout.astro)

```css
:root {
  --color-primary: #3b82f6;
  --color-secondary: #1e40af;
  --color-accent: #5b21b6;
  --color-bg: #f8fafc;
  --color-text: #1f2937;
}
```

### Sistema de Niveles

Los niveles de sección tienen estilos diferenciados:

- **Nivel 1**: Sin fondo, sin borde, solo línea separadora
- **Nivel 2**: Borde izquierdo azul, fondo transparente
- **Nivel 3**: Tarjeta con borde, sombra y padding

### Responsive

- Mobile-first
- TOC oculto en móvil
- Grid adaptativo para figuras

---

## Cómo Añadir un Nuevo Paquete de Trabajo

### Paso 1: Crear entrada de contenido

```json
// src/content/work-packages/o2.json
{
  "title": "Paquete de Trabajo 2",
  "slug": "o2",
  "description": "Descripción del paquete",
  "dataPath": "/data/o2.json",
  "heroImage": "/assets/o2/hero.jpg",
  "order": 2
}
```

### Paso 2: Crear JSON de datos

```json
// public/data/o2.json
{
  "sections": [...],
  "tables": [...],
  "figures": [...]
}
```

### Paso 3: Añadir assets

```
public/assets/o2/
├── _page_XX_Figure_Y.jpeg
└── ...
```

### Paso 4: Actualizar media-manifest.json

Añadir las nuevas figuras al manifiesto.

---

## Convenciones de Nomenclatura

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Paquete | `o{n}` | `o1`, `o2` |
| Sección | `o{n}-section-{m}` | `o1-section-1` |
| Tabla | `o{n}-table-{m}` | `o1-table-1` |
| Figura | `o{n}-figure-{m}` | `o1-figure-1` |
| Asset | `_page_{n}_Figure_{m}.jpeg` | `_page_10_Figure_2.jpeg` |

---

## Notas Técnicas Importantes

1. **SSG + Client-side hydration**: El contenido se genera estáticamente pero los datos se cargan en el cliente
2. **Markdown con extensiones**: Se usa `marked` con `breaks: true`
3. **Lazy loading**: Las imágenes usan `loading="lazy"`
4. **Accesibilidad**: Estructura semántica, navegación por teclado
5. **SEO**: Meta tags dinámicos, URLs limpias

---

## Problemas Conocidos y Soluciones

| Problema | Solución |
|----------|----------|
| Contenido no carga | Verificar que el JSON en `/public/data/` existe y es válido |
| Figuras no aparecen | Comprobar rutas en `media-manifest.json` y carpeta de assets |
| Estilos rotos | Los estilos están en componentes Astro, verificar scoped vs global |

---

## Próximas Mejoras Sugeridas

- [ ] Modo oscuro
- [ ] Búsqueda full-text en contenido
- [ ] Exportar a PDF
- [ ] Sistema de versiones de documentos
- [ ] Internacionalización (i18n)

---

*Documento generado para recuperación de contexto en futuras sesiones de desarrollo.*
*Última actualización: Febrero 2026*