# Guía de Estilos — Informe ODS 2030
## Normativa Universitaria Española

> Documento de referencia completo para el diseño visual y la implementación front-end del portal de informes ODServa2030. Versión 1.0 — Uso interno.

---

## Índice

1. [Fundamentos del diseño](#1-fundamentos-del-diseño)
2. [Sistema de color](#2-sistema-de-color)
3. [Tipografía](#3-tipografía)
4. [Espaciado y grid](#4-espaciado-y-grid)
5. [Layout — Estructura de página](#5-layout--estructura-de-página)
6. [Sidebar — Navegación lateral](#6-sidebar--navegación-lateral)
7. [Cabecera del documento](#7-cabecera-del-documento)
8. [Jerarquía de títulos](#8-jerarquía-de-títulos)
9. [Texto de cuerpo](#9-texto-de-cuerpo)
10. [Componentes de contenido](#10-componentes-de-contenido)
11. [Etiquetas ODS](#11-etiquetas-ods)
12. [Figuras y tablas](#12-figuras-y-tablas)
13. [Estadísticas y métricas](#13-estadísticas-y-métricas)
14. [Animaciones y transiciones](#14-animaciones-y-transiciones)
15. [Variables CSS — Referencia completa](#15-variables-css--referencia-completa)
16. [Accesibilidad](#16-accesibilidad)
17. [Qué NO hacer](#17-qué-no-hacer)

---

## 1. Fundamentos del diseño

### Filosofía visual

El diseño se basa en tres principios rectores:

- **Autoridad académica** — El proyecto comunica rigor, seriedad y credibilidad institucional. Cada decisión visual refuerza la confianza en los datos.
- **Legibilidad prolongada** — Los informes son textos largos. El diseño prioriza la comodidad de lectura por encima de efectos llamativos.
- **Calidez funcional** — Se evita la frialdad de los informes institucionales genéricos. Los colores cálidos y la tipografía humanista hacen el contenido accesible y cercano.

### Tono estético

El estilo es **editorial refinado con influencia académica**. Referentes visuales: publicaciones universitarias de Oxford o MIT Press, revistas científicas de alto impacto con diseño cuidado (Nature, Science), anuarios de sostenibilidad de grandes organismos (PNUD, UNESCO).

**No** es un sitio web corporativo. **No** es un dashboard de datos. Es un documento digital de lectura, diseñado para ser estudiado.

---

## 2. Sistema de color

### Paleta principal

```css
/* VERDES — Color institucional */
--green-deep:   #1a3a2e;   /* Verde muy oscuro. Sidebar, titulares principales, énfasis máximo */
--green-mid:    #2d6a4f;   /* Verde medio. Títulos de nivel 3, bordes de tarjetas */
--green-accent: #40916c;   /* Verde activo. Barras decorativas de sección, links activos */
--green-light:  #74c69d;   /* Verde claro. Acentos de sidebar, iconos secundarios */
--green-pale:   #d8f3dc;   /* Verde muy pálido. Fondos de chips/tags de categoría */

/* DORADOS — Acento de énfasis */
--gold:         #c9a84c;   /* Oro principal. Badge, pull quotes, línea activa del sidebar */
--gold-light:   #f0dfa0;   /* Oro pálido. Fondos suaves de elementos destacados */

/* NEUTROS — Fondos y texto */
--cream:        #faf8f3;   /* Fondo principal de la página. Blanco cálido, no puro */
--paper:        #f5f1e8;   /* Fondo secundario. Tarjetas, bloques de cita, figuras vacías */
--ink:          #1c1c1c;   /* Texto principal en negritas y destacados */
--ink-mid:      #3d3d3d;   /* Texto de cuerpo estándar */
--ink-soft:     #6b6b6b;   /* Texto secundario, metadatos, pies de figura */
--border:       #d5cfc0;   /* Bordes y divisores. Tono cálido, nunca gris neutro */
```

### Paleta de ODS (tags semánticos)

Cada ODS o grupo temático tiene su propio par de colores (fondo + texto + borde):

```css
/* Grupo SOCIAL (ODS 1, 2, 3, 4, 5) */
--ods-social-bg:    #e8f5e9;
--ods-social-text:  #2e7d32;
--ods-social-border:#a5d6a7;

/* Grupo ECONÓMICO (ODS 8, 9, 10, 12) */
--ods-eco-bg:       #fff3e0;
--ods-eco-text:     #e65100;
--ods-eco-border:   #ffcc80;

/* Grupo AMBIENTAL (ODS 6, 7, 13, 14, 15) */
--ods-env-bg:       #e3f2fd;
--ods-env-text:     #1565c0;
--ods-env-border:   #90caf9;

/* Grupo INSTITUCIONAL (ODS 16, 17) */
--ods-inst-bg:      #fce4ec;
--ods-inst-text:    #ad1457;
--ods-inst-border:  #f48fb1;
```

### Reglas de uso del color

1. **El verde oscuro (`#1a3a2e`) es el color dominante** — Aparece solo en el sidebar y en la línea decorativa del encabezado del documento. Su uso excesivo en el área de contenido lo desvaloriza.
2. **El dorado (`#c9a84c`) es un acento escaso** — Solo en tres lugares: badge del sidebar, borde de pull quotes, y línea decorativa bajo el título principal. Nunca como fondo de bloques grandes.
3. **El fondo nunca es blanco puro (`#ffffff`)** — Siempre usar `--cream` (`#faf8f3`) para el área principal y `--paper` (`#f5f1e8`) para bloques interiores. El blanco puro solo se usa en tarjetas de nivel cards con sombra.
4. **Los bordes son siempre cálidos** — Usar `--border` (`#d5cfc0`), nunca grises fríos tipo `#e0e0e0` o `#cccccc`.

---

## 3. Tipografía

### Familias tipográficas

Se usan exactamente **tres familias**, cada una con un rol específico e irremplazable:

#### Playfair Display — Tipografía de display
- **Rol:** Títulos principales, pull quotes, números estadísticos grandes
- **Origen:** Google Fonts
- **Import:** `family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400`
- **Carácter:** Serif clásico con alto contraste entre trazos finos y gruesos. Evoca tradición académica y publicaciones de prestigio.
- **Uso correcto:** Solo en tamaños grandes (≥1rem). Nunca en cuerpo de texto continuo.

#### Source Serif 4 — Tipografía de cuerpo
- **Rol:** Todo el texto de lectura continua (párrafos, descripciones)
- **Origen:** Google Fonts
- **Import:** `family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300`
- **Carácter:** Serif contemporáneo diseñado para pantallas. Excelente legibilidad en tamaños pequeños y lectura prolongada.
- **Peso principal:** 300 (light) para el cuerpo estándar, 600 para negritas dentro del texto.

#### DM Sans — Tipografía funcional
- **Rol:** UI, etiquetas, navegación, metadatos, badges, botones, kickers, captions
- **Origen:** Google Fonts
- **Import:** `family=DM+Sans:wght@300;400;500`
- **Carácter:** Sans-serif geométrico humanista. Legible a tamaños muy pequeños. Contrasta bien con las dos fuentes serif.
- **Peso principal:** 400 para texto funcional, 500 para etiquetas y labels.

### Escala tipográfica

| Elemento | Familia | Peso | Tamaño | Interlineado | Uso |
|---|---|---|---|---|---|
| Título del documento (h1) | Playfair Display | 700 | 2rem | 1.25 | Una vez por página |
| Título de sección (h2-label) | DM Sans | 500 | 0.72rem | — | Kicker en mayúsculas + tracking |
| Subtítulo (h3) | Playfair Display | 600 | 1.2rem | 1.35 | Subsecciones dentro de sección |
| Sub-subtítulo (h4) | DM Sans | 500 | 0.85rem | — | Etiqueta en mayúsculas + tracking 0.06em |
| Cuerpo de texto | Source Serif 4 | 300 | 0.95rem | 1.85 | Párrafos de lectura |
| Negrita en cuerpo | Source Serif 4 | 600 | heredado | heredado | Énfasis dentro de párrafo |
| Navegación sidebar | DM Sans | 400 | 0.78rem | 1.4 | Items de nav |
| Nav nivel 1 | DM Sans | 500 | 0.68rem | — | Mayúsculas + tracking 0.06em |
| Nav nivel 3 | DM Sans | 400 | 0.73rem | — | Más opaco (45% blanco) |
| Metadatos / captions | DM Sans | 400 | 0.7–0.73rem | — | Pies de figura, etiquetas |
| Badge / label | DM Sans | 500 | 0.65rem | — | Mayúsculas + tracking 0.1em |
| Pull quote | Playfair Display | 400 itálica | 1.05rem | 1.6 | Citas destacadas |
| Estadística numérica | Playfair Display | 700 | 2rem | 1 | Dentro de stat-box |

### Reglas tipográficas

1. **Letter-spacing en DM Sans:** Los textos en DM Sans a tamaños pequeños (kickers, badges, labels) siempre llevan `letter-spacing` entre `0.06em` y `0.18em`. Nunca usar tracking en serif.
2. **Itálica con intención:** La itálica en Playfair Display (display, no texto) se usa para resaltar conceptos clave dentro de títulos (`<em>Agenda 2030</em>`). No se usa en el cuerpo de texto estándar.
3. **Nunca mezclar pesos extremos en un mismo bloque:** No usar 300 y 700 juntos en la misma línea excepto para énfasis deliberado.

---

## 4. Espaciado y grid

### Sistema de espaciado base

Toda medida de espaciado se basa en múltiplos de `0.4rem` (equivale a ~6.4px en base 16px):

```
0.4rem  — 6px   — Espacio mínimo entre elementos inline (gap de tags)
0.8rem  — 13px  — Espacio entre badge y título en sidebar header
1rem    — 16px  — Padding base de nav items
1.2rem  — 19px  — Padding de tarjetas (nivel cards)
1.5rem  — 24px  — Padding horizontal del sidebar
2rem    — 32px  — Padding superior del sidebar header, separación entre secciones menores
2.5rem  — 40px  — Separación bajo la cabecera del documento
3rem    — 48px  — Padding superior/inferior del área de contenido principal
3.5rem  — 56px  — Margen inferior entre secciones de contenido
4rem    — 64px  — Padding horizontal del área de contenido
```

### Grid de página

```
┌──────────────────────────────────────────────────────┐
│ SIDEBAR (270px fijo) │ CONTENIDO PRINCIPAL (flex: 1) │
│                      │ max-width: 860px               │
│                      │ padding: 3rem 4rem             │
└──────────────────────────────────────────────────────┘
```

- El sidebar tiene **ancho fijo de 270px** (`--sidebar-w: 270px`). No se redimensiona.
- El área de contenido es `flex: 1` con `max-width: 860px`. En pantallas muy anchas el contenido no se estira.
- Padding del contenido: `3rem` arriba/abajo, `4rem` izquierda/derecha.
- El sidebar es `position: sticky; top: 0; height: 100vh` — se queda fijo al hacer scroll.

---

## 5. Layout — Estructura de página

### Estructura HTML raíz

```html
<body>
  <aside class="sidebar">…</aside>
  <main class="main">
    <div class="doc-header">…</div>
    <div class="stats-row">…</div>
    <section class="section" id="…">…</section>
    <section class="section" id="…">…</section>
  </main>
</body>
```

```css
body {
  display: flex;
  min-height: 100vh;
  background: var(--cream);
  color: var(--ink);
}
```

### Orden de elementos dentro de una sección

Cada `<section class="section">` sigue este orden estricto:

1. `div.section-heading` — Kicker de la sección (barra + título en mayúsculas)
2. `div.ods-tags` *(opcional)* — Tags de ODS relacionados
3. Párrafos de introducción
4. `div.pull-quote` *(opcional)* — Cita destacada
5. `h3.subsection-title` + párrafos — Subsecciones
6. `div.nivel-cards` *(si aplica)* — Tarjetas de nivel
7. `h4.sub-subsection-title` + párrafos — Sub-subsecciones
8. `div.figure-placeholder` + `p.fig-caption` — Figuras

---

## 6. Sidebar — Navegación lateral

### Estructura del sidebar

```html
<aside class="sidebar">
  <div class="sidebar-header">
    <div class="sidebar-badge">O1 · Informe</div>
    <div class="sidebar-title">Título del informe</div>
    <div class="sidebar-meta">
      <span>32 secciones</span>
      <span>10 tablas</span>
    </div>
  </div>
  <nav class="sidebar-nav">
    <div class="nav-section-label">Índice</div>
    <a href="#" class="nav-item level-1">Introducción</a>
    <a href="#" class="nav-item level-2">Subsección</a>
    <a href="#" class="nav-item level-3">Sub-subsección</a>
    <div class="nav-divider"></div>
  </nav>
</aside>
```

### Estilos del sidebar

**Fondo del sidebar:**
```css
.sidebar {
  width: 270px;
  background: var(--green-deep); /* #1a3a2e */
  color: #e8f5ee;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}
```

**Header del sidebar** — Gradiente sutil más oscuro:
```css
.sidebar-header {
  padding: 2rem 1.5rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: linear-gradient(160deg, #0f2820 0%, #1a3a2e 100%);
}
```

**Badge del informe:**
```css
.sidebar-badge {
  display: inline-flex;
  background: var(--gold);         /* #c9a84c */
  color: var(--green-deep);        /* Texto oscuro sobre dorado */
  font-family: 'DM Sans';
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.25rem 0.6rem;
  border-radius: 2px;              /* Casi cuadrado, no pill */
  margin-bottom: 0.8rem;
}
```

**Título en sidebar:**
```css
.sidebar-title {
  font-family: 'Playfair Display';
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  color: #ffffff;
}
```

**Metadatos del sidebar:**
```css
.sidebar-meta {
  font-family: 'DM Sans';
  font-size: 0.72rem;
  color: rgba(255,255,255,0.45);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
/* Prefijo decorativo ante cada metadato */
.sidebar-meta span::before {
  content: '— ';
  color: var(--green-light);
  opacity: 0.5;
}
```

### Niveles de navegación

#### Nav label (separador de grupo)
```css
.nav-section-label {
  font-family: 'DM Sans';
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
  padding: 0.8rem 1.5rem 0.3rem;
}
```

#### Nivel 1 — Secciones principales
```css
.nav-item.level-1 {
  font-weight: 500;
  color: rgba(255,255,255,0.85);
  padding: 0.6rem 1.5rem;
  text-transform: uppercase;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  border-left: 2px solid transparent;
}
```

#### Nivel 2 — Subsecciones
```css
.nav-item.level-2 {
  padding-left: 2.2rem;           /* +0.7rem respecto al nivel 1 */
  font-size: 0.78rem;
  color: rgba(255,255,255,0.65);
}
```

#### Nivel 3 — Sub-subsecciones
```css
.nav-item.level-3 {
  padding-left: 3rem;             /* +0.8rem respecto al nivel 2 */
  font-size: 0.73rem;
  color: rgba(255,255,255,0.45); /* Más desvaneciado que nivel 2 */
}
```

#### Estado activo
```css
.nav-item.active {
  color: var(--green-pale);
  border-left: 2px solid var(--gold);   /* Línea dorada en el borde izquierdo */
  background: rgba(255,255,255,0.04);
}
```

#### Estado hover
```css
.nav-item:hover {
  color: #ffffff;
  background: rgba(255,255,255,0.05);
  border-left: 2px solid var(--green-light);
}
```

### Divisor de secciones en nav
```css
.nav-divider {
  height: 1px;
  background: rgba(255,255,255,0.07);
  margin: 0.6rem 1.5rem;
}
```

### Scrollbar del sidebar
```css
.sidebar::-webkit-scrollbar { width: 4px; }
.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
}
```

---

## 7. Cabecera del documento

La cabecera es el primer elemento visible dentro de `<main>`. Establece el contexto del documento.

### Estructura
```html
<div class="doc-header">
  <div class="doc-kicker">Normativa Universitaria Española · 2024</div>
  <h1 class="doc-title">
    Avances y necesidades en la implementación de la <em>Agenda 2030</em>
    en la normativa universitaria
  </h1>
</div>
```

### Estilos
```css
.doc-header {
  padding-bottom: 2.5rem;
  margin-bottom: 3rem;
  border-bottom: 2px solid var(--green-deep);  /* Línea gruesa inferior */
  position: relative;
}

/* Línea dorada corta debajo de la línea principal */
.doc-header::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 80px;
  height: 2px;
  background: var(--gold);
}

.doc-kicker {
  font-family: 'DM Sans';
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--green-accent);
  margin-bottom: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Línea horizontal antes del kicker */
.doc-kicker::before {
  content: '';
  display: block;
  width: 20px;
  height: 1px;
  background: var(--green-accent);
}

.doc-title {
  font-family: 'Playfair Display';
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--green-deep);
  max-width: 600px;             /* No ocupa todo el ancho */
}

/* Término clave en itálica accentuada */
.doc-title em {
  font-style: italic;
  color: var(--green-accent);
}
```

**Detalle importante:** La doble línea inferior (`border-bottom` verde oscuro + `::after` dorado corto) es la **firma visual** de la cabecera. El desplazamiento de `-5px` crea un efecto de superposición que da profundidad sin sombras.

---

## 8. Jerarquía de títulos

### Cabecera de sección (H2)

```html
<div class="section-heading">
  <div class="section-heading-bar"></div>
  <h2 class="section-title">Contextualización</h2>
</div>
```

```css
.section-heading {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
}

/* Barra vertical decorativa */
.section-heading-bar {
  width: 4px;
  height: 1.6rem;
  background: linear-gradient(to bottom, var(--green-accent), var(--green-light));
  border-radius: 2px;
  flex-shrink: 0;
}

h2.section-title {
  font-family: 'DM Sans';
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--green-accent);
}
```

> La barra vertical con gradiente verde es el **marcador visual** de inicio de sección. Es el elemento más reconocible del sistema.

### Subtítulo de subsección (H3)

```css
h3.subsection-title {
  font-family: 'Playfair Display';
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--green-deep);
  margin: 2rem 0 0.8rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--border);   /* Línea fina debajo */
}
```

### Sub-subtítulo (H4)

```css
h4.sub-subsection-title {
  font-family: 'DM Sans';
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--green-mid);
  margin: 1.4rem 0 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
```

### Resumen de jerarquía visual

```
H1  — Playfair Display 700, 2rem, verde oscuro       → Una vez, cabecera principal
H2  — DM Sans 500, 0.72rem, verde acento, tracking   → Inicio de cada sección
H3  — Playfair Display 600, 1.2rem, verde oscuro     → Subsecciones dentro
H4  — DM Sans 500, 0.85rem, verde medio, uppercase   → Sub-apartados
```

---

## 9. Texto de cuerpo

### Párrafo estándar

```css
p {
  font-family: 'Source Serif 4';
  font-size: 0.95rem;
  line-height: 1.85;           /* Interlineado generoso para lectura cómoda */
  color: var(--ink-mid);       /* #3d3d3d, no negro puro */
  margin-bottom: 1.1rem;
  font-weight: 300;            /* Light — más suave a tamaños pequeños */
}

p strong {
  font-weight: 600;
  color: var(--ink);           /* #1c1c1c — más oscuro que el párrafo base */
}
```

**Por qué line-height 1.85:** Los informes académicos tienen párrafos densos. Un interlineado de 1.85 (85% más alto que la fuente) reduce la fatiga visual en lectura prolongada. Comparar con el estándar web de 1.5 — aquí es deliberadamente más holgado.

**Por qué font-weight 300:** Source Serif 4 en peso 300 tiene un trazo fino y elegante que luce mucho mejor en pantalla que el 400 estándar para textos largos. El contraste con las negritas en 600 es más marcado.

---

## 10. Componentes de contenido

### Pull Quote — Cita destacada

Usado para resaltar la idea más importante de una sección. **Máximo uno por sección.**

```html
<div class="pull-quote">
  <p>Texto de la cita o idea central que merece atención especial.</p>
</div>
```

```css
.pull-quote {
  border-left: 3px solid var(--gold);      /* Borde dorado — único uso del gold en contenido */
  padding: 1rem 1.5rem;
  margin: 2rem 0;
  background: var(--paper);               /* Fondo crema más oscuro que la página */
  border-radius: 0 4px 4px 0;             /* Solo las esquinas derechas redondeadas */
}

.pull-quote p {
  font-family: 'Playfair Display';
  font-style: italic;
  font-size: 1.05rem;
  color: var(--green-deep);
  margin: 0;
  line-height: 1.6;
}
```

**Reglas de uso:**
- Solo para ideas de gran relevancia, no para información factual
- Nunca más de uno por sección
- El texto debe poder leerse de forma independiente, sin contexto del párrafo anterior

---

### Nivel Cards — Tarjetas de categoría

Para presentar elementos paralelos estructurados (ej: los tres niveles de análisis).

```html
<div class="nivel-cards">
  <div class="nivel-card">
    <span class="nivel-icon">Estatal</span>
    <div class="nivel-content">
      <h4>Nombre del nivel</h4>
      <p>Descripción del nivel o categoría analizada.</p>
    </div>
  </div>
</div>
```

```css
.nivel-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1.5rem 0;
}

.nivel-card {
  display: flex;
  gap: 1rem;
  padding: 1.1rem 1.3rem;
  background: #ffffff;                    /* Blanco puro — contrasta con fondo crema */
  border: 1px solid var(--border);
  border-radius: 6px;
  border-left: 4px solid var(--green-accent);   /* Borde izquierdo de color */
  transition: box-shadow 0.2s;
}

.nivel-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}
```

**Sistema de colores por orden de tarjeta:**

| Posición | Color del borde izquierdo | Color del badge |
|---|---|---|
| 1ª tarjeta | `--green-accent` (#40916c) | Verde sobre blanco |
| 2ª tarjeta | `--gold` (#c9a84c) | Dorado, texto verde oscuro |
| 3ª tarjeta | `--green-mid` (#2d6a4f) | Verde medio sobre blanco |

```css
/* Aplicar en el 2º y 3er card: */
.nivel-card:nth-child(2) { border-left-color: var(--gold); }
.nivel-card:nth-child(3) { border-left-color: var(--green-mid); }

.nivel-icon {
  font-family: 'DM Sans';
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #ffffff;
  background: var(--green-accent);
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  height: fit-content;
  margin-top: 0.1rem;
  white-space: nowrap;
}

.nivel-card:nth-child(2) .nivel-icon {
  background: var(--gold);
  color: var(--green-deep);             /* Texto oscuro sobre fondo dorado */
}

.nivel-content h4 {
  font-family: 'DM Sans';
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--ink);
  margin-bottom: 0.3rem;
}

.nivel-content p {
  font-size: 0.83rem;
  line-height: 1.6;
  margin: 0;
  color: var(--ink-soft);
}
```

---

## 11. Etiquetas ODS

Las etiquetas identifican qué Objetivos de Desarrollo Sostenible son relevantes para cada sección o análisis.

```html
<div class="ods-tags">
  <span class="ods-tag t2">ODS 4 · Educación</span>
  <span class="ods-tag t3">ODS 16 · Instituciones</span>
  <span class="ods-tag t1">ODS 17 · Alianzas</span>
</div>
```

```css
.ods-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 1rem 0;
}

.ods-tag {
  font-family: 'DM Sans';
  font-size: 0.65rem;
  font-weight: 500;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;              /* Pill shape */
  border: 1px solid;                /* El color lo define la clase modificadora */
}
```

**Clases modificadoras de color:**

```css
.ods-tag.t1 {   /* Económico / Alianzas */
  background: #fff3e0;
  color: #e65100;
  border-color: #ffcc80;
}

.ods-tag.t2 {   /* Social / Educación */
  background: #e8f5e9;
  color: #2e7d32;
  border-color: #a5d6a7;
}

.ods-tag.t3 {   /* Institucional / Gobernanza */
  background: #e3f2fd;
  color: #1565c0;
  border-color: #90caf9;
}

.ods-tag.t4 {   /* Igualdad / Género */
  background: #fce4ec;
  color: #ad1457;
  border-color: #f48fb1;
}
```

**Formato del texto:** Siempre `ODS {número} · {nombre corto}`. El punto alto `·` es el separador estándar. Nombre máximo de 2 palabras.

---

## 12. Figuras y tablas

### Placeholder de figura

Cuando la figura aún no está disponible, se usa un bloque placeholder.

```html
<div class="figure-placeholder">
  <div class="fig-icon">📊</div>
  <p>Figura 1.1 — Descripción breve de la figura</p>
</div>
<p class="fig-caption">Fig. 1.1. Descripción completa de la figura con contexto metodológico.</p>
```

```css
.figure-placeholder {
  background: var(--paper);
  border: 1px dashed var(--border);   /* Borde discontinuo indica "pendiente" */
  border-radius: 6px;
  padding: 2.5rem;
  text-align: center;
  margin: 1.5rem 0;
}

.figure-placeholder .fig-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.4;
}

.figure-placeholder p {
  font-family: 'DM Sans';
  font-size: 0.75rem;
  color: var(--ink-soft);
  margin: 0;
}

.fig-caption {
  font-family: 'DM Sans';
  font-size: 0.73rem;
  color: var(--ink-soft);
  text-align: center;
  margin-top: 0.5rem;
  font-style: italic;
}
```

**Numeración de figuras:** Formato `Fig. {sección}.{orden}` — ejemplo: `Fig. 2.1` para la primera figura de la sección 2. En el título interno del placeholder se usa `Figura` completo; en el caption se abrevia `Fig.`

### Figuras reales (imágenes/gráficos)

```css
.figure-real {
  margin: 1.5rem 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.figure-real img {
  width: 100%;
  display: block;
}
```

---

## 13. Estadísticas y métricas

La barra de estadísticas aparece una sola vez, justo después de la cabecera del documento. Ofrece una visión rápida del alcance del informe.

```html
<div class="stats-row">
  <div class="stat-box">
    <span class="stat-number">76</span>
    <span class="stat-label">Universidades analizadas</span>
  </div>
  <div class="stat-box">…</div>
  <div class="stat-box">…</div>
</div>
```

```css
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;                           /* El gap es tan pequeño que simula una línea */
  background: var(--border);          /* El fondo del grid se convierte en el separador */
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  margin: 2rem 0;
}

.stat-box {
  background: var(--paper);
  padding: 1.2rem 1.4rem;
  text-align: center;
}

.stat-number {
  font-family: 'Playfair Display';
  font-size: 2rem;
  font-weight: 700;
  color: var(--green-deep);
  display: block;
  line-height: 1;
  margin-bottom: 0.3rem;
}

.stat-label {
  font-family: 'DM Sans';
  font-size: 0.7rem;
  color: var(--ink-soft);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

**Técnica del separador:** El `gap: 1px` sobre un fondo `var(--border)` crea separadores perfectamente finos entre las celdas sin necesidad de bordes individuales. Es más limpio y consistente.

---

## 14. Animaciones y transiciones

### Fade-in de secciones

Las secciones de contenido se animan al cargar la página con un fade desde abajo:

```css
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section {
  animation: fadeUp 0.5s ease forwards;
}

/* Cada sección siguiente tiene un delay acumulado */
.section:nth-child(2) { animation-delay: 0.05s; }
.section:nth-child(3) { animation-delay: 0.10s; }
.section:nth-child(4) { animation-delay: 0.15s; }
```

**Principio:** El desplazamiento de `16px` es suficiente para percibir movimiento sin que se sienta exagerado en un documento formal.

### Transiciones de hover

```css
/* Cards */
.nivel-card {
  transition: box-shadow 0.2s;
}
.nivel-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}

/* Nav items */
.nav-item {
  transition: all 0.15s;
}
```

**Regla general:** Las transiciones en el sidebar son `0.15s` (rápidas, feedback inmediato de UI). Las transiciones de contenido son `0.2s` (ligeramente más lentas, más suaves). Las animaciones de carga son `0.5s`.

---

## 15. Variables CSS — Referencia completa

```css
:root {
  /* ── COLORES VERDES ── */
  --green-deep:         #1a3a2e;
  --green-mid:          #2d6a4f;
  --green-accent:       #40916c;
  --green-light:        #74c69d;
  --green-pale:         #d8f3dc;

  /* ── COLORES DORADOS ── */
  --gold:               #c9a84c;
  --gold-light:         #f0dfa0;

  /* ── FONDOS ── */
  --cream:              #faf8f3;   /* Fondo principal */
  --paper:              #f5f1e8;   /* Fondo secundario / bloques */

  /* ── TEXTO ── */
  --ink:                #1c1c1c;   /* Texto de máximo énfasis */
  --ink-mid:            #3d3d3d;   /* Texto de cuerpo estándar */
  --ink-soft:           #6b6b6b;   /* Texto secundario y metadatos */

  /* ── BORDES ── */
  --border:             #d5cfc0;   /* Separadores y bordes de componentes */

  /* ── LAYOUT ── */
  --sidebar-w:          270px;

  /* ── ODS GRUPOS ── */
  --ods-social-bg:      #e8f5e9;
  --ods-social-text:    #2e7d32;
  --ods-social-border:  #a5d6a7;
  --ods-eco-bg:         #fff3e0;
  --ods-eco-text:       #e65100;
  --ods-eco-border:     #ffcc80;
  --ods-env-bg:         #e3f2fd;
  --ods-env-text:       #1565c0;
  --ods-env-border:     #90caf9;
  --ods-inst-bg:        #fce4ec;
  --ods-inst-text:      #ad1457;
  --ods-inst-border:    #f48fb1;
}
```

---

## 16. Accesibilidad

### Contraste de color

Todos los pares de texto/fondo cumplen con WCAG 2.1 AA (ratio mínimo 4.5:1 para texto normal, 3:1 para texto grande):

| Texto | Fondo | Ratio estimado | Resultado |
|---|---|---|---|
| `--ink-mid` (#3d3d3d) | `--cream` (#faf8f3) | ~8.5:1 | ✅ AAA |
| `--green-deep` (#1a3a2e) | `--cream` (#faf8f3) | ~12:1 | ✅ AAA |
| `--green-accent` (#40916c) | `--cream` (#faf8f3) | ~4.6:1 | ✅ AA |
| Texto blanco | `--green-deep` (#1a3a2e) | ~13:1 | ✅ AAA |
| `--gold` texto oscuro | `--gold` (#c9a84c) background | >4.5:1 | ✅ AA |

### Jerarquía semántica

- Un solo `<h1>` por página (el título del documento)
- Los `h2` son siempre los `.section-title` — no saltar niveles
- Los nav items usan `<a>` con `href` real o `#id` de sección
- Los badges y etiquetas decorativas usan `<span>`, no `<div>`

### Foco de teclado

Añadir siempre:
```css
.nav-item:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}
```

---

## 17. Qué NO hacer

Esta sección es tan importante como las anteriores. Documenta las decisiones de diseño que se han rechazado conscientemente.

### ❌ Colores

- **No usar blanco puro `#ffffff`** como fondo de página. Solo en tarjetas con sombra.
- **No usar grises fríos** para bordes (`#e0e0e0`, `#cccccc`). Siempre usar `--border` cálido.
- **No usar más de un 20% de superficie dorada** en cualquier pantalla. El dorado pierde su valor de acento.
- **No usar gradientes morados, azules o rosas** — rompen la identidad verde-oro.

### ❌ Tipografía

- **No usar Inter, Roboto, ni Arial** — son las fuentes más genéricas en diseño digital. Este sistema usa fuentes con personalidad.
- **No usar Playfair Display en tamaños inferiores a 1rem** — a tamaños pequeños pierde legibilidad por su alto contraste entre trazos.
- **No usar DM Sans para texto de lectura continua** — es funcional pero sin calidez para textos largos.
- **No usar más de 3 tamaños de fuente en una misma sección** visible.
- **No mezclar itálica serif con texto DM Sans** en la misma línea.

### ❌ Layout

- **No cambiar el ancho del sidebar de 270px** — está calibrado para que los títulos largos no rompan en más de 2 líneas.
- **No poner `max-width` inferior a 700px** en el área de contenido — los títulos H1 a 2rem necesitan espacio horizontal.
- **No añadir un tercer panel** o columna al layout — la tensión sidebar/contenido es suficiente.

### ❌ Componentes

- **No usar más de 3 nivel-cards en un mismo bloque** — pierde efectividad y se convierte en una lista con estilos.
- **No usar pull quotes consecutivos** — deben estar separados por al menos dos párrafos.
- **No poner etiquetas ODS en cada párrafo** — solo al inicio de la sección o subsección cuando corresponda.
- **No usar `border-radius` superior a 8px** en ningún componente — el diseño es formal, no redondeado.
- **No usar sombras `box-shadow` oscuras** — solo sombras muy sutiles `rgba(0,0,0,0.06)` en hover.

### ❌ Animaciones

- **No animar el sidebar** — debe sentirse estático y sólido.
- **No usar `transform: scale()`** en hover — los documentos académicos no tienen elementos que "crezcan".
- **No superar 0.5s en ninguna animación** de contenido.

---

*Guía de Estilos ODS 2030 — v1.0*
*Para sugerencias de actualización, consultar con el equipo de diseño del proyecto ODServa2030.*
