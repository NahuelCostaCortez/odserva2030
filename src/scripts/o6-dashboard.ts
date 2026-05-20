import {
  Chart, BarController, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js';
import Papa from 'papaparse';

type CsvRow = Record<string, string | number | null | undefined>;
type ChartConfig = {
  chartType: 'bar';
  csvPath: string;
  title: string;
  xKey: string;
  yKey: string;
  indexAxis?: 'x' | 'y';
  groupKey?: string;
  colorMap?: Record<string, string>;
  yMax?: number;
  xAxisLabel?: string;
  datasetLabel?: string;
  showLegend?: boolean;
  color?: string;
};

const odsColorMap: Record<string, string> = {
  ODS1: '#e03e4c', ODS2: '#d3a029', ODS3: '#4c9f38', ODS4: '#c43c44',
  ODS5: '#ff6b4a', ODS6: '#2a9fd6', ODS7: '#fcc30b', ODS8: '#b04364',
  ODS9: '#ff8c4a', ODS10: '#e3337e', ODS11: '#f6a53a', ODS12: '#bf8b2e',
  ODS13: '#5c9a63', ODS14: '#0a97d9', ODS15: '#56c02b', ODS16: '#2f7ea8',
  ODS17: '#1b4f72'
};

const lifeCatColors: Record<string, string> = {
  ENV: '#2a9fd6', NAT: '#4c9f38', CCA: '#f6a53a', CCM: '#5c9a63',
  IPC: '#2B5E8E', GIE: '#e3337e', GIC: '#e3337e', CET: '#fcc30b',
  FAB: '#bf8b2e', CCE: '#b04364',
};

const subareaNames: Record<string, string> = {
  IQM: 'Ingeniería química', QMC: 'Química', ENE: 'Energía', TRA: 'Transporte',
  AYA: 'Astronomía y astrofísica', ESP: 'Investigación espacial',
  FPN: 'Física de partículas y nuclear', FYA: 'Física y aplicaciones',
  MBM: 'Materiales para biomedicina', MEN: 'Materiales para energía/medioambiente',
  MES: 'Materiales estructurales', MFU: 'Materiales con funcionalidad eléct./magn./ópt./térm.',
  MTM: 'Ciencias matemáticas',
  IBI: 'Ingeniería biomédica', ICA: 'Ingeniería civil y arquitectura',
  IEA: 'Ingeniería eléctrica, electrónica y automática',
  INA: 'Ingeniería mecánica, naval y aeronáutica',
  INF: 'Ciencias de la computación e informática',
  MNF: 'Microelectrónica, nanotecnología y fotónica',
  TCO: 'Tecnologías de las comunicaciones',
  COM: 'Comunicación', CPO: 'Ciencia política',
  FEM: 'Estudios feministas, de mujeres y género', GEO: 'Geografía',
  SOC: 'Sociología y antropología social', DER: 'Derecho',
  EYA: 'Economía y aplicaciones', EYF: 'Empresas y finanzas',
  MAE: 'Métodos de análisis económico', EDU: 'Ciencias de la educación',
  ART: 'Arte, bellas artes, museística',
  LFL: 'Literatura, filología y estudios culturales',
  FIL: 'Filosofía', LYL: 'Lingüística y lenguas',
  ARQ: 'Arqueología', HIS: 'Historia', PSI: 'Psicología',
  BIF: 'Biología integrativa y fisiología', BMC: 'Biología molecular y celular',
  BTC: 'Biotecnología', CAN: 'Cáncer',
  DPT: 'Herramientas diagnósticas y terapéuticas',
  ESN: 'Enfermedades del sistema nervioso', FOS: 'Fisiopatología de órganos y sistemas',
  IIT: 'Inmunidad, infección y nuevas terapias',
  ALI: 'Ciencias y tecnologías de alimentos', AYF: 'Agricultura y forestal',
  GYA: 'Ganadería y acuicultura', BDV: 'Biodiversidad',
  CTA: 'Ciencias de la Tierra y del agua', CYA: 'Clima y atmósfera',
  MAR: 'Ciencias y tecnologías marinas', POL: 'Investigación polar',
  TMA: 'Tecnologías medioambientales',
  FCM: 'Física de la materia condensada', FAB: 'Fabricación avanzada',
};

const ODS_COLS = Array.from({ length: 17 }, (_, i) => `ODS${i + 1}`);

Chart.register(BarController, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const chartRegistry = new Map<string, Chart>();

function csvUrl(name: string): string {
  return '/csvs/o6/' + encodeURIComponent(name);
}

async function parseCsv(url: string): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true, header: true, dynamicTyping: false,
      complete: (r) => resolve(r.data as CsvRow[]),
      error: reject,
    });
  });
}

async function buildChart(canvasId: string, cfg: ChartConfig): Promise<void> {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;

  if (chartRegistry.has(canvasId)) chartRegistry.get(canvasId)!.destroy();

  const rows = await parseCsv('/' + cfg.csvPath);
  const validRows = rows.filter(r => r[cfg.xKey] != null && r[cfg.yKey] != null && String(r[cfg.yKey]).trim() !== '');
  const labels = validRows.map(r => String(r[cfg.xKey]));
  const values = validRows.map(r => Number(r[cfg.yKey]));
  const colors = cfg.groupKey && cfg.colorMap
    ? validRows.map(r => cfg.colorMap![String(r[cfg.groupKey!])] ?? '#999')
    : validRows.map(() => cfg.color ?? '#2B5E8E');

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: cfg.datasetLabel ?? cfg.title,
        data: values,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 0,
        borderRadius: 3,
      }],
    },
    options: {
      indexAxis: cfg.indexAxis ?? 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: cfg.showLegend ?? false },
        title: { display: true, text: cfg.title, color: '#2a2a2a', font: { size: 12, weight: 500 as const } },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed[cfg.indexAxis === 'y' ? 'x' : 'y'] ?? 0;
              return ` ${Number(v).toLocaleString('es-ES')}${cfg.xAxisLabel ? ' ' + cfg.xAxisLabel : ''}`;
            },
          },
        },
      },
      scales: {
        x: { max: cfg.indexAxis === 'y' ? cfg.yMax : undefined, ticks: { font: { size: 11 } }, grid: { display: cfg.indexAxis !== 'y' } },
        y: { max: cfg.indexAxis !== 'y' ? cfg.yMax : undefined, ticks: { font: { size: 10 } }, grid: { display: cfg.indexAxis === 'y' } },
      },
    },
  });
  chartRegistry.set(canvasId, chart);
}

// ─── Tabla 1 tabs ───────────────────────────────────────────
function initTabla1Tabs(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>('#o6-dashboard .tabla1-tab');
  const panels = document.querySelectorAll<HTMLElement>('#o6-dashboard .tabla1-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => { p.style.display = 'none'; });
      tab.classList.add('active');
      const target = document.getElementById(`o6-tabla1-${tab.dataset.panel}`);
      if (target) target.style.display = 'grid';
    });
  });
  if (panels.length) (panels[0] as HTMLElement).style.display = 'grid';
}

// ─── PDC table ──────────────────────────────────────────────
const PDC_CSV: Record<number, string> = {
  2021: 'Tabla 2- Proyectos Pruebas de Concepto año 2021.csv',
  2022: 'Tabla 3- Proyectos Pruebas de Concepto año 2022.csv',
  2023: 'Tabla 4- Proyectos Pruebas de Concepto año 2023.csv',
};

let pdcCurrentYear = 2021;
const pdcCache: Record<number, CsvRow[]> = {};
let pdcAllRows: CsvRow[] = [];
let pdcFiltered: CsvRow[] = [];
let pdcPage = 0;
const PDC_PAGE = 30;

function normCCAA(s: string): string {
  return s.trim()
    .replace('PDO.ASTURIAS', 'ASTURIAS')
    .replace('C.VALENCIANA', 'C. VALENCIANA');
}

async function switchPdcYear(year: number): Promise<void> {
  pdcCurrentYear = year;
  document.querySelectorAll<HTMLButtonElement>('#o6-dashboard .pdc-year-tab').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.year) === year);
  });

  if (!pdcCache[year]) {
    const tbody = document.getElementById('pdc-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="table-loading">Cargando datos…</td></tr>';
    const raw = await parseCsv(csvUrl(PDC_CSV[year]));
    pdcCache[year] = raw.filter(r => String(r['REF.'] ?? '').startsWith('PDC'));
  }

  pdcAllRows = pdcCache[year];
  pdcPage = 0;
  populatePdcCCAA();
  applyPdcFilters();
}

function populatePdcCCAA(): void {
  const sel = document.getElementById('pdc-f-ccaa') as HTMLSelectElement | null;
  if (!sel) return;
  sel.length = 1;
  const vals = [...new Set(pdcAllRows.map(r => normCCAA(String(r['CCAA'] ?? ''))).filter(Boolean))].sort();
  vals.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = v;
    sel.appendChild(opt);
  });
}

function applyPdcFilters(): void {
  const search = ((document.getElementById('pdc-f-search') as HTMLInputElement)?.value ?? '').toLowerCase();
  const ods = (document.getElementById('pdc-f-ods') as HTMLSelectElement)?.value ?? '';
  const ccaa = (document.getElementById('pdc-f-ccaa') as HTMLSelectElement)?.value ?? '';

  pdcFiltered = pdcAllRows.filter(r => {
    if (search) {
      const ref = String(r['REF.'] ?? '').toLowerCase();
      const uni = String(r['BENEFICIARIO'] ?? '').toLowerCase();
      if (!ref.includes(search) && !uni.includes(search)) return false;
    }
    if (ccaa && normCCAA(String(r['CCAA'] ?? '')) !== ccaa) return false;
    if (ods && String(r[ods] ?? '').trim().toUpperCase() !== 'SI') return false;
    return true;
  });
  pdcPage = 0;
  renderPdcTable();
}

function renderPdcTable(): void {
  const tbody = document.getElementById('pdc-tbody');
  if (!tbody) return;

  const total = pdcFiltered.length;
  const totalPages = Math.max(1, Math.ceil(total / PDC_PAGE));
  const start = pdcPage * PDC_PAGE;
  const end = Math.min(start + PDC_PAGE, total);

  tbody.innerHTML = pdcFiltered.slice(start, end).map(r => {
    const odsTags = ODS_COLS
      .filter(o => String(r[o] ?? '').trim().toUpperCase() === 'SI')
      .map(o => `<span class="ods-num-badge" style="background:${odsColorMap[o] ?? '#999'}" title="${o}">${o.replace('ODS', '')}</span>`)
      .join('');
    const cuantia = Number(r['CUANTÍA'] ?? 0);
    const cuantiaFmt = cuantia > 0 ? cuantia.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' €' : '—';
    const sub = String(r['SUBÁREA'] ?? '');
    const subFull = subareaNames[sub] ?? sub;
    const uni = String(r['BENEFICIARIO'] ?? '');
    const ccaa = normCCAA(String(r['CCAA'] ?? ''));
    const ref = String(r['REF.'] ?? '');

    return `<tr>
      <td class="td-ref" title="${ref}">${ref.replace(/PDC202\d-/, '')}</td>
      <td class="td-sub"><abbr title="${subFull}">${sub}</abbr></td>
      <td class="td-uni" title="${uni}">${uni}</td>
      <td class="td-ccaa">${ccaa}</td>
      <td class="td-cuantia">${cuantiaFmt}</td>
      <td class="td-ods">${odsTags || '<span class="no-ods">—</span>'}</td>
    </tr>`;
  }).join('');

  const infoEl = document.getElementById('pdc-info');
  if (infoEl) {
    const base = total !== pdcAllRows.length
      ? `${total.toLocaleString('es-ES')} de ${pdcAllRows.length.toLocaleString('es-ES')} proyectos`
      : `${total.toLocaleString('es-ES')} proyectos`;
    infoEl.textContent = `${base} · pág. ${pdcPage + 1} / ${totalPages}`;
  }
  const prevBtn = document.getElementById('pdc-prev') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('pdc-next') as HTMLButtonElement | null;
  if (prevBtn) prevBtn.disabled = pdcPage === 0;
  if (nextBtn) nextBtn.disabled = end >= total;
}

function attachPdcFilters(): void {
  ['pdc-f-search', 'pdc-f-ccaa', 'pdc-f-ods'].forEach(id => {
    const el = document.getElementById(id);
    el?.addEventListener('input', applyPdcFilters);
    el?.addEventListener('change', applyPdcFilters);
  });
  document.getElementById('pdc-reset')?.addEventListener('click', () => {
    (document.getElementById('pdc-f-search') as HTMLInputElement).value = '';
    (document.getElementById('pdc-f-ccaa') as HTMLSelectElement).selectedIndex = 0;
    (document.getElementById('pdc-f-ods') as HTMLSelectElement).selectedIndex = 0;
    applyPdcFilters();
  });
  document.getElementById('pdc-prev')?.addEventListener('click', () => { pdcPage--; renderPdcTable(); });
  document.getElementById('pdc-next')?.addEventListener('click', () => { pdcPage++; renderPdcTable(); });

  document.querySelectorAll<HTMLButtonElement>('#o6-dashboard .pdc-year-tab').forEach(btn => {
    btn.addEventListener('click', () => switchPdcYear(Number(btn.dataset.year)));
  });
}

// ─── LIFE table ─────────────────────────────────────────────
const LIFE_CSV: Record<number, string> = {
  2016: 'Tabla 5- Proyectos LIFE año 2016.csv',
  2017: 'Tabla 6- Proyectos LIFE año 2017.csv',
  2018: 'Tabla 7- Proyectos LIFE año 2018.csv',
  2019: 'Tabla 8- Proyectos LIFE año 2019.csv',
  2020: 'Tabla 9- Proyectos LIFE año 2020.csv',
  2021: 'Tabla 10- Proyectos LIFE año 2021.csv',
  2022: 'Tabla 11- Proyectos LIFE año 2022.csv',
  2023: 'Tabla 12- Proyectos LIFE año 2023.csv',
};

type LifeRow = CsvRow & { _year: string };

let lifeAllRows: LifeRow[] = [];
let lifeFiltered: LifeRow[] = [];
let lifePage = 0;
const LIFE_PAGE = 25;

function lifeCategory(ref: string): string {
  const m = ref.match(/LIFE\d{2}[ -]([A-Z]+)/) ?? ref.match(/LIFE\d{2}-([A-Z]+)-/);
  return m ? m[1] : '';
}

async function loadAllLife(): Promise<void> {
  const tbody = document.getElementById('life-tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="table-loading">Cargando datos…</td></tr>';

  const yearEntries = Object.entries(LIFE_CSV).map(([y, fname]) =>
    parseCsv(csvUrl(fname)).then(rows =>
      rows
        .filter(r => String(r['REF.'] ?? '').startsWith('LIFE'))
        .map(r => ({ ...r, _year: y } as LifeRow))
    )
  );

  const results = await Promise.all(yearEntries);
  lifeAllRows = results.flat();
  lifeFiltered = [...lifeAllRows];

  populateLifeFilters();
  renderLifeTable();
  attachLifeFilters();
}

function populateLifeFilters(): void {
  const selCCAA = document.getElementById('life-f-ccaa') as HTMLSelectElement | null;
  if (selCCAA) {
    const vals = [...new Set(lifeAllRows.map(r => String(r['CCAA'] ?? '').trim()).filter(Boolean))].sort();
    vals.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v; opt.textContent = v;
      selCCAA.appendChild(opt);
    });
  }
}

function applyLifeFilters(): void {
  const search = ((document.getElementById('life-f-search') as HTMLInputElement)?.value ?? '').toLowerCase();
  const year = (document.getElementById('life-f-year') as HTMLSelectElement)?.value ?? '';
  const ccaa = (document.getElementById('life-f-ccaa') as HTMLSelectElement)?.value ?? '';
  const ods = (document.getElementById('life-f-ods') as HTMLSelectElement)?.value ?? '';

  lifeFiltered = lifeAllRows.filter(r => {
    if (search) {
      const titulo = String(r['TÍTULO'] ?? '').toLowerCase();
      const uni = String(r['BENEFICIARIO'] ?? '').toLowerCase();
      const ref = String(r['REF.'] ?? '').toLowerCase();
      if (!titulo.includes(search) && !uni.includes(search) && !ref.includes(search)) return false;
    }
    if (year && r._year !== year) return false;
    if (ccaa && String(r['CCAA'] ?? '').trim() !== ccaa) return false;
    if (ods && String(r[ods] ?? '').trim().toUpperCase() !== 'SI') return false;
    return true;
  });
  lifePage = 0;
  renderLifeTable();
}

function renderLifeTable(): void {
  const tbody = document.getElementById('life-tbody');
  if (!tbody) return;

  const total = lifeFiltered.length;
  const totalPages = Math.max(1, Math.ceil(total / LIFE_PAGE));
  const start = lifePage * LIFE_PAGE;
  const end = Math.min(start + LIFE_PAGE, total);

  tbody.innerHTML = lifeFiltered.slice(start, end).map(r => {
    const ref = String(r['REF.'] ?? '');
    const cat = lifeCategory(ref);
    const catColor = lifeCatColors[cat] ?? '#999';
    const catBadge = cat ? `<span class="life-cat-badge" style="background:${catColor}">${cat}</span>` : '';
    const titulo = String(r['TÍTULO'] ?? '');
    const uni = String(r['BENEFICIARIO'] ?? '');
    const ccaa = String(r['CCAA'] ?? '').trim();
    const inicio = String(r['INICIO'] ?? '').slice(-4);
    const fin = String(r['FIN'] ?? '').slice(-4);
    const periodo = inicio && fin ? `${inicio}–${fin}` : '—';
    const ue = Number(r['CONTRIBUCIÓN UE'] ?? 0);
    const ueFmt = ue > 0 ? (ue / 1_000_000).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' M€' : '—';
    const odsTags = ODS_COLS
      .filter(o => String(r[o] ?? '').trim().toUpperCase() === 'SI')
      .map(o => `<span class="ods-num-badge" style="background:${odsColorMap[o] ?? '#999'}" title="${o}">${o.replace('ODS', '')}</span>`)
      .join('');

    return `<tr>
      <td class="td-year">${r._year}</td>
      <td class="td-cat">${catBadge}</td>
      <td class="td-titulo" title="${titulo.replace(/"/g, '&quot;')}">${titulo}</td>
      <td class="td-uni" title="${uni.replace(/"/g, '&quot;')}">${uni}</td>
      <td class="td-ccaa">${ccaa}</td>
      <td class="td-periodo">${periodo}</td>
      <td class="td-ue">${ueFmt}</td>
      <td class="td-ods">${odsTags || '<span class="no-ods">—</span>'}</td>
    </tr>`;
  }).join('');

  const infoEl = document.getElementById('life-info');
  if (infoEl) {
    const base = total !== lifeAllRows.length
      ? `${total.toLocaleString('es-ES')} de ${lifeAllRows.length.toLocaleString('es-ES')} participaciones`
      : `${total.toLocaleString('es-ES')} participaciones`;
    infoEl.textContent = `${base} · pág. ${lifePage + 1} / ${totalPages}`;
  }
  const prevBtn = document.getElementById('life-prev') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('life-next') as HTMLButtonElement | null;
  if (prevBtn) prevBtn.disabled = lifePage === 0;
  if (nextBtn) nextBtn.disabled = end >= total;
}

function attachLifeFilters(): void {
  ['life-f-search', 'life-f-year', 'life-f-ccaa', 'life-f-ods'].forEach(id => {
    const el = document.getElementById(id);
    el?.addEventListener('input', applyLifeFilters);
    el?.addEventListener('change', applyLifeFilters);
  });
  document.getElementById('life-reset')?.addEventListener('click', () => {
    (document.getElementById('life-f-search') as HTMLInputElement).value = '';
    ['life-f-year', 'life-f-ccaa', 'life-f-ods'].forEach(id => {
      (document.getElementById(id) as HTMLSelectElement).selectedIndex = 0;
    });
    applyLifeFilters();
  });
  document.getElementById('life-prev')?.addEventListener('click', () => { lifePage--; renderLifeTable(); });
  document.getElementById('life-next')?.addEventListener('click', () => { lifePage++; renderLifeTable(); });
}

// ─── Boot ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('o6-dashboard')) return;

  initTabla1Tabs();
  attachPdcFilters();
  switchPdcYear(2021);
  loadAllLife();

  Promise.all([
    buildChart('chart-pdc-proyectos', {
      chartType: 'bar',
      csvPath: 'csvs/o6/pdc_resumen_anio.csv',
      title: 'Proyectos PDC por año de convocatoria',
      xKey: 'Año', yKey: 'Proyectos',
      color: '#2B5E8E', datasetLabel: 'Proyectos', xAxisLabel: 'proyectos',
    }),
    buildChart('chart-pdc-cuantia', {
      chartType: 'bar',
      csvPath: 'csvs/o6/pdc_resumen_anio.csv',
      title: 'Cuantía media por proyecto y año (€)',
      xKey: 'Año', yKey: 'CuantiaMedia',
      color: '#c9973a', datasetLabel: 'Cuantía media', xAxisLabel: '€',
    }),
    buildChart('chart-pdc-ods', {
      chartType: 'bar',
      csvPath: 'csvs/o6/pdc_ods_total.csv',
      title: 'Proyectos PDC por ODS — acumulado 2021–2023',
      xKey: 'ODS', yKey: 'Count', indexAxis: 'y',
      groupKey: 'ODS', colorMap: odsColorMap,
      datasetLabel: 'Proyectos', xAxisLabel: 'proyectos',
    }),
    buildChart('chart-pdc-ccaa', {
      chartType: 'bar',
      csvPath: 'csvs/o6/pdc_ccaa_top.csv',
      title: 'Proyectos PDC por Comunidad Autónoma',
      xKey: 'CCAA', yKey: 'Proyectos', indexAxis: 'y',
      color: '#2B5E8E', datasetLabel: 'Proyectos', xAxisLabel: 'proyectos',
    }),
    buildChart('chart-life-proyectos', {
      chartType: 'bar',
      csvPath: 'csvs/o6/life_resumen_anio.csv',
      title: 'Proyectos LIFE únicos por año (universidades españolas)',
      xKey: 'Año', yKey: 'ProyectosUnicos',
      color: '#5c9a63', datasetLabel: 'Proyectos únicos', xAxisLabel: 'proyectos',
    }),
    buildChart('chart-life-ue', {
      chartType: 'bar',
      csvPath: 'csvs/o6/life_resumen_anio.csv',
      title: 'Contribución UE a proyectos LIFE por año (€)',
      xKey: 'Año', yKey: 'ContribucionUE',
      color: '#0a97d9', datasetLabel: 'Contribución UE', xAxisLabel: '€',
    }),
    buildChart('chart-life-ods', {
      chartType: 'bar',
      csvPath: 'csvs/o6/life_ods_total.csv',
      title: 'Proyectos LIFE por ODS — acumulado 2016–2023',
      xKey: 'ODS', yKey: 'Count', indexAxis: 'y',
      groupKey: 'ODS', colorMap: odsColorMap,
      datasetLabel: 'Proyectos', xAxisLabel: 'proyectos',
    }),
    buildChart('chart-life-ccaa', {
      chartType: 'bar',
      csvPath: 'csvs/o6/life_ccaa_top.csv',
      title: 'Participaciones LIFE por Comunidad Autónoma',
      xKey: 'CCAA', yKey: 'Participaciones', indexAxis: 'y',
      color: '#5c9a63', datasetLabel: 'Participaciones', xAxisLabel: 'partic.',
    }),
  ]);
});
