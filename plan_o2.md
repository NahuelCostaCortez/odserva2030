# Plan O2 Dashboard

## Secciones y contenido

| ID | Título | Tipo |
|----|--------|------|
| o2-hero | Hero | texto estático |
| o2-intro | Introducción | texto (3 párrafos del markdown) |
| o2-normativa | Propuestas: Normativa universitaria | tabs 3 niveles + ODS clause explorer |
| o2-gobierno | Propuestas: Órganos de gobierno | 3 dimension cards con bullets |
| o2-practicas | Buenas prácticas | bar chart top10 + KPI stats + listas |
| o2-conclusiones | Conclusiones | texto |

## Interactividad

- **Tabs nivel normativa**: Estatal / Autonómico / Estatutario → bullets
- **ODS Clause Explorer**: grid 17 ODS coloreados → click → panel con targets + cláusula
- **Top10 bar chart**: horizontal, Chart.js, CSV
- **KPI stats**: 5 números grandes estáticos (gobernanza)

## Archivos a crear

- `public/csvs/o2/top10_menciones.csv`
- `src/scripts/o2-dashboard.ts`
- `src/components/dashboards/O2Dashboard.astro`
- Update `[slug].astro` (import + nav + routing)

## Datos top10 (del markdown)
Oviedo=124, Zaragoza=106, Málaga=80, UPV=71, Valladolid=67,
UAB=65(aprox), UTAM=63(aprox), LaLaguna=61(aprox), PompeuFabra=53, Granada=51

## KPIs gobernanza
- 33 universidades: alternancia rectorado
- 30 universidades: alternancia gerencia
- 24 universidades: paridad consejo rectoral (40-60%)
- 17 universidades: vicerrectorado + Agenda 2030 transversal
- 22 universidades: comisión de sostenibilidad

## Referencias buenas prácticas gobernanza
- ODS5 género: Granada, La Laguna, Las Palmas GC
- Tamaño consejo: Abat Oliba, Extremadura, Lleida, Pablo Olavide, UPC, UPV, Pontificia Comillas
- Sostenibilidad: U.Barcelona, U.Cádiz, UPCartagena, Rey Juan Carlos, Loyola Andalucía, UIC

## Nav sidebar o2
- o2-hero: Introducción (level 1)
- o2-normativa: Propuestas: Normativa (level 1)
- o2-gobierno: Propuestas: Gobierno (level 1)
- o2-practicas: Buenas prácticas (level 1)
- o2-conclusiones: Conclusiones (level 1)
