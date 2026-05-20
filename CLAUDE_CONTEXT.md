# ODServa2030 — Contexto de trabajo para Claude

> Documento de briefing para retomar el trabajo de "tuneado" de paquetes en una nueva sesión.
> Working directory: `C:\Users\adrar\Desktop\Curro\archivos\odserva2030`
> Platform: Windows 10, PowerShell. Usar `py` (no `python3`) si hace falta ejecutar Python.

---

## 1. Qué es el proyecto

**ODServa2030** es un Astro 5.x SSG (generación estática) que presenta informes sobre la implementación de la Agenda 2030 en el sistema universitario español. Cada informe es un "paquete" (O1, O2, O3...). El trabajo consiste en convertir los paquetes que aún se visualizan como texto plano en **dashboards interactivos** con gráficos Chart.js, tabs, filtros y diseño esquemático.

El usuario llama a esto "tunear" un paquete.

---

## 2. Estructura de ficheros

```
src/
  components/dashboards/    ← Un {O#}Dashboard.astro por paquete tuneado
  scripts/                  ← Un o{#}-dashboard.ts por paquete tuneado
  pages/paquetes/[slug].astro  ← Router central (MODIFICAR para añadir nuevo paquete)
  content/work-packages/    ← o1.json, o2.json... (config de cada paquete, NO editar)

public/
  data/                     ← o1.json, o2.json... (contenido extraído del PDF: secciones, figuras, tablas)
  csvs/                     ← o1/, o2/, o9/... CSVs de datos para los gráficos
  assets/                   ← o1/, o2/... imágenes extraídas del PDF

markdown/                   ← Markdown original extraído de los PDFs (fuente de verdad del contenido)
```

### Ficheros clave a leer cuando se va a tunear un paquete nuevo

1. `markdown/O{N}. .../O{N}...md` — contenido completo del informe (fuente de verdad)
2. `public/data/o{n}.json` — estructura de secciones, figuras y tablas extraídas
3. `public/csvs/o{n}/` — CSVs de datos ya existentes (si los hay)
4. `src/pages/paquetes/[slug].astro` — para entender el router y añadir el nuevo paquete

**Nota sobre paths con caracteres especiales**: El Read tool de Claude NO puede abrir paths con tildes/ñ en el nombre de carpeta del markdown. Usar PowerShell así:
```powershell
$dir = Get-ChildItem "...\markdown" | Where-Object { $_.Name -like "*O9*" }
$mdFile = Get-ChildItem $dir.FullName | Where-Object { $_.Name -like "*.md" }
Get-Content $mdFile.FullName -Encoding UTF8 | Select-Object -First 200 | Out-String
```

---

## 3. Estado actual de los paquetes

| Paquete | Estado | Notas |
|---------|--------|-------|
| O1 | ✅ Dashboard completo | Muy complejo, con hub ODS interactivo, zoom, tabs, etc. Script canónico. |
| O2 | ✅ Dashboard completo | Tabs, tarjetas normativa, buenas prácticas |
| O3 | ⏸ Pendiente | Explícitamente aplazado por el usuario ("nos saltamos o3 por ahora") |
| O4 | ✅ Dashboard completo | Puro texto → visual. Acordeón crisis, tabs competencias/campos/audiencia, barras ECTS |
| O5 | ❌ Sin tunear | Proyectos de investigación |
| O6 | ❌ Sin tunear | Proyectos de transferencia |
| O9 | ✅ Dashboard completo | Buenas prácticas investigación. Gráficos proyectos/financiación por ODS, cards filtrables |
| O10 | ❌ Sin tunear | Informe de transparencia |
| O11 | ❌ Sin tunear | Informe de transparencia informativa |
| O13 | ❌ Sin tunear | Guía stakeholders |

---

## 4. Cómo tunear un paquete nuevo — Workflow

### Paso 1: Leer y comprender el contenido
- Leer el markdown del paquete (ver nota sobre paths con tildes)
- Leer `public/data/o{n}.json` para ver qué figuras/tablas/secciones hay
- Ver qué CSVs existen en `public/csvs/o{n}/`

### Paso 2: Planear el dashboard
- Dividir en secciones lógicas (hero, contexto, datos principales, sub-análisis, conclusiones)
- Identificar qué puede ser interactivo (tabs, filtros, acordeones)
- Identificar qué datos merece la pena visualizar con Chart.js
- Identificar si faltan CSVs (crearlos desde datos del texto del markdown)

### Paso 3: Crear los ficheros
1. **CSVs de datos** en `public/csvs/o{n}/` si hacen falta
2. **`src/scripts/o{n}-dashboard.ts`** — toda la lógica JS
3. **`src/components/dashboards/O{N}Dashboard.astro`** — todo el HTML + CSS

### Paso 4: Actualizar el router
En `src/pages/paquetes/[slug].astro`:
- Añadir el import del nuevo dashboard
- Añadir entrada en `dashboardNavs` con las secciones del nav lateral
- Añadir la rama `slug === 'o{n}'` en el bloque de routing del `<main>`

---

## 5. Design system — Variables CSS y estética

```css
var(--brand)       /* azul oscuro institucional #2B5E8E */
var(--brand-soft)  /* azul muy claro, hover backgrounds */
var(--paper)       /* blanco/crema, fondos de cards */
var(--border)      /* gris claro para bordes */
var(--ink)         /* casi negro para texto */
var(--gold)        /* #c9973a, acento dorado */
var(--green-deep), var(--green-accent)  /* verdes institucionales */
```

**Font**: `var(--font-base)` — Roboto Slab serif.

### Patrones CSS usados en dashboards
- El CSS del dashboard va en `<style is:global>` al final del .astro, **todo scoped bajo `#o{n}-dashboard`**
- Cards con `background: var(--paper); border: 1px solid var(--border); border-radius: 6px`
- Accent lateral: `border-left: 3px solid var(--brand)` o `border-top: 4px solid var(--p-color)`
- Gradientes suaves: `color-mix(in srgb, var(--brand) 6%, white)` para fondos tintados
- Hover de nav: `color: var(--brand); background: var(--brand-soft); border-left: 2px solid var(--brand)`

### Clases estructurales estándar (usar en todos los dashboards)
```html
<div id="o{n}-dashboard">
  <section id="o{n}-hero" class="dash-section dash-hero">
  <section id="o{n}-xxx" class="dash-section">
    <h2 class="dash-title">...</h2>
    <p class="dash-context">...</p>
    <h3 class="dash-subtitle">...</h3>
    <div class="chart-box"><canvas id="chart-xxx"></canvas></div>
```

---

## 6. Chart.js — Patrones de código

### Script canónico de referencia: `src/scripts/o1-dashboard.ts`
Es el más completo. Tiene: CSV cache, chart registry (destroy), zoom plugin (hammerjs), line series, pivotMode, stacked, groupKey coloring. Los demás scripts (o2, o4, o9) son versiones simplificadas del mismo patrón.

### ODS Color Map (usar siempre estos colores exactos)
```typescript
const odsColorMap: Record<string, string> = {
  'AGENDA 2030': '#6EC1E4',
  ODS1: '#e03e4c', ODS2: '#d3a029', ODS3: '#4c9f38', ODS4: '#c43c44',
  ODS5: '#ff6b4a', ODS6: '#2a9fd6', ODS7: '#fcc30b', ODS8: '#b04364',
  ODS9: '#ff8c4a', ODS10: '#e3337e', ODS11: '#f6a53a', ODS12: '#bf8b2e',
  ODS13: '#5c9a63', ODS14: '#0a97d9', ODS15: '#56c02b', ODS16: '#2f7ea8',
  ODS17: '#1b4f72'
};
```

### Patrón buildChart básico (o9-dashboard.ts como referencia limpia)
El buildChart de o9 es la versión mínima y limpia. El de o1 es la versión completa con zoom.

**Coloreado per-barra por ODS** (evita el bug de barras finas con multi-dataset):
```typescript
// CSV tiene columna ODS (valores: 'ODS1', 'ODS3'...) + columna de label + columna de valor
buildChart('mi-chart', {
  chartType: 'bar',
  csvPath: 'csvs/o9/datos.csv',
  xKey: 'Nombre',       // columna con el label de la barra
  yKey: 'Valor',        // columna con el valor numérico
  indexAxis: 'y',       // horizontal
  groupKey: 'ODS',      // columna usada para buscar color en colorMap
  colorMap: odsColorMap,
  showLegend: false,    // sin leyenda (colores ya identifican)
})
```

### CSVs — Columnas y keys
- El `xKey` debe coincidir con el nombre de columna en el CSV (case-sensitive)
- El `groupKey` también debe coincidir exactamente
- Los valores del `groupKey` deben coincidir con las keys del `colorMap`
- En filtros de cards con `data-ods`, separar ODS con espacios: `data-ods="ODS7 ODS13"`. En JS, hacer `split(' ').includes(filter)` — NO `.includes()` directo sobre el string (causa bug: "ODS1" es substring de "ODS17")

### Imports necesarios en un script nuevo (versión simplificada)
```typescript
import { Chart, BarController, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Papa from 'papaparse';
```
Para versión con líneas y zoom (como o1): añadir `LineController, LineElement, PointElement`, `zoomPlugin from 'chartjs-plugin-zoom'`, `'hammerjs'`.

### Boot guard — siempre al final
```typescript
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('o{n}-dashboard')) return;
  // llamadas a init...
});
```

---

## 7. Patrones de interactividad

### Tabs simples
```typescript
// HTML: botones con data-tab, paneles con data-panel
// activo: clase .active en botón, display:block en panel
function initTabs(btnSelector: string, panelById: (key: string) => HTMLElement | null) {
  document.querySelectorAll<HTMLButtonElement>(btnSelector).forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll<HTMLButtonElement>(btnSelector).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // ocultar todos los paneles, mostrar el del btn
    });
  });
}
```

### Acordeón (usado en O4 para crisis cards)
- Elemento con clase `.o4-crisis-card`, toggle `.open`
- Un solo elemento abierto a la vez (cerrar todos, abrir el clicked, excepto si ya estaba abierto)
- Ícono rota 45° cuando `.open`: `transition: transform 0.25s` en el toggle button

### Filtro de cards (usado en O9 para buenas prácticas)
- Botones con `data-filter="all"` o `data-filter="ODS7"`
- Cards con `data-ods="ODS7 ODS13"` (espacio-separado)
- JS: `odsArr.includes(filter)` para mostrar/ocultar

### Stepper (usado en O1 para targets)
- `#step-prev` / `#step-next` buttons, `.step-panel` divs, `.step-indicator` para "2 / 5"
- O1 tiene la implementación completa en `initStepper()`

---

## 8. Router `[slug].astro` — cómo añadir un paquete

```astro
---
// 1. Añadir import al inicio
import O{N}Dashboard from '../../components/dashboards/O{N}Dashboard.astro';

// 2. Añadir entrada en dashboardNavs
const dashboardNavs = {
  o{n}: [
    { slug: 'o{n}-hero',     title: 'Resumen',     level: 1 },
    { slug: 'o{n}-datos',    title: 'Datos',       level: 1 },
    // ...
  ],
  // ...paquetes existentes...
};
---

// 3. Añadir rama en el bloque de routing del <main>
{slug === 'o{n}' ? (
  <O{N}Dashboard pkg={pkg} />
) : slug === 'o1' ? (
  ...
```

Los `level` del nav: 1 = item principal (uppercase, bold), 2 = subitem (indent).

---

## 9. Principios editoriales (lo que el usuario espera)

- **Veracidad ante todo**: el dashboard debe reflejar fielmente el markdown del paquete. Nunca resumir de forma que induzca a error o malinterpretación — si un dato es matizable, se pone completo.
- **Eliminar secciones no sustantivas**: anexos, bibliografía, referencias, agradecimientos, páginas de autoría/créditos — no incluirlos.
- **Visual y conciso, pero sin sacrificar información**: el objetivo es dinamismo y claridad (estilo dashboard), no reducir a toda costa. Texto y datos escritos están permitidos cuando el contenido lo exige (como en O4, que es puro contenido denso). No hay que forzar gráficos donde no aportan.
- **Gráficos e interactividad donde mejoren la comprensión**: si el texto tiene datos numéricos tabulables, valorar crear un CSV y visualizarlo. Si el contenido se presta a tabs, acordeón o filtros, usarlos. Pero son herramientas, no obligación.
- **Puede ser denso**: no hay problema en poner mucha información si está bien organizada.

---

## 10. Gotchas y advertencias

- **Windows path con tildes**: El Read tool falla con rutas que tienen `á/é/ó/ú/ñ` en el nombre de carpeta. Usar PowerShell `Get-ChildItem | Where-Object` para navegar, luego `Get-Content` para leer.
- **`py` no `python3`**: En este PC Windows, el comando Python es `py`.
- **Nunca ejecutar el servidor de desarrollo** tras hacer cambios — el usuario lo arranca manualmente cuando quiere probar. No lanzar `npm run dev`, `astro dev` ni similares.
- **Nunca hacer commit automáticamente** — solo commitear si el usuario lo pide explícitamente.
- **ripgrep instalado**: `rg` está disponible (instalado vía winget, mayo 2026). El Grep tool funciona nativamente — preferir Grep sobre PowerShell `Select-String` para búsquedas en código.
- **CSS `font.weight`**: En Chart.js usar `weight: 500 as const` (número), no `'500'` (string) — causa error TypeScript.
- **PapaParse**: No tiene tipos, genera TS7016 (pre-existente en el proyecto, no bloqueante).
- **`color-mix()`**: Funciona en Chrome/Firefox modernos, usado en O4 y O9 para tints de color.
- **Assets O9**: Las imágenes del PDF de O9 están en la carpeta markdown, NO se copiaron a `public/assets/o9/`. Si se necesitan, habrá que copiarlas.
- **Nunca editar** `src/content/work-packages/o{n}.json` — son configs auto-generadas.
- **Astro `is:global`**: El CSS en dashboards usa `<style is:global>` con todo scoped bajo `#o{n}-dashboard { ... }`. Sin `is:global` el CSS no llegaría a los elementos del script.

---

## 11. Ejemplo de estructura mínima de un dashboard nuevo

### `src/scripts/o{n}-dashboard.ts`
```typescript
import { Chart, BarController, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Papa from 'papaparse';

const odsColorMap = { ODS1: '#e03e4c', /* ... */ ODS17: '#1b4f72' };

async function buildChart(canvasId: string, cfg: any): Promise<void> {
  // ver o9-dashboard.ts para implementación completa
}

function initMiSeccion() { /* tabs, filtros, etc. */ }

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('o{n}-dashboard')) return;
  initMiSeccion();
});
```

### `src/components/dashboards/O{N}Dashboard.astro`
```astro
---
const { pkg } = Astro.props;
---
<div id="o{n}-dashboard">
  <section id="o{n}-hero" class="dash-section dash-hero">
    <div class="doc-kicker">Kicker · 2024</div>
    <h1 class="doc-title">{pkg.data.title}</h1>
    <!-- hero stats, contexto... -->
  </section>
  <!-- más secciones -->
</div>

<script>
  import '../../scripts/o{n}-dashboard.ts';
</script>

<style is:global>
  #o{n}-dashboard { padding: 0 2.5rem 4rem; max-width: 1100px; }
  #o{n}-dashboard .dash-section { padding: 3rem 0; border-bottom: 1px solid var(--border); }
  /* ... todo el CSS del dashboard ... */
</style>
```
