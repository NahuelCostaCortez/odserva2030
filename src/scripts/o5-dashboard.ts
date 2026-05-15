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

type EurRow = {
  Anio: string; Tipo: string; ID: string; Titulo: string;
  Beneficiario: string; CCAA: string; Inicio: string; Fin: string;
  Cuantia: string; ODS: string;
};

const odsColorMap: Record<string, string> = {
  ODS1: '#e03e4c', ODS2: '#d3a029', ODS3: '#4c9f38', ODS4: '#c43c44',
  ODS5: '#ff6b4a', ODS6: '#2a9fd6', ODS7: '#fcc30b', ODS8: '#b04364',
  ODS9: '#ff8c4a', ODS10: '#e3337e', ODS11: '#f6a53a', ODS12: '#bf8b2e',
  ODS13: '#5c9a63', ODS14: '#0a97d9', ODS15: '#56c02b', ODS16: '#2f7ea8',
  ODS17: '#1b4f72'
};

const horizonColorMap: Record<string, string> = {
  'Horizonte 2020': '#2B5E8E',
  'Horizonte Europa': '#c9973a',
};

Chart.register(BarController, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const chartRegistry = new Map<string, Chart>();

async function buildChart(canvasId: string, cfg: ChartConfig): Promise<void> {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;

  if (chartRegistry.has(canvasId)) chartRegistry.get(canvasId)!.destroy();

  const rows: CsvRow[] = await new Promise((resolve, reject) => {
    Papa.parse(`/${cfg.csvPath}`, {
      download: true, header: true, dynamicTyping: true,
      complete: (r) => resolve(r.data as CsvRow[]),
      error: reject
    });
  });

  const validRows = rows.filter(r => r[cfg.xKey] != null && r[cfg.yKey] != null);
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
        borderRadius: 3
      }]
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
            }
          }
        }
      },
      scales: {
        x: { max: cfg.indexAxis === 'y' ? cfg.yMax : undefined, ticks: { font: { size: 11 } }, grid: { display: cfg.indexAxis !== 'y' } },
        y: { max: cfg.indexAxis !== 'y' ? cfg.yMax : undefined, ticks: { font: { size: 10 } }, grid: { display: cfg.indexAxis === 'y' } }
      }
    }
  });
  chartRegistry.set(canvasId, chart);
}

// ─── Tabla 1 classification tabs ───────────────────────────
function initTabla1Tabs(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>('#o5-dashboard .tabla1-tab');
  const panels = document.querySelectorAll<HTMLElement>('#o5-dashboard .tabla1-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => { p.style.display = 'none'; });
      tab.classList.add('active');
      const target = document.getElementById(`tabla1-${tab.dataset.panel}`);
      if (target) target.style.display = 'grid';
    });
  });
  if (panels.length) (panels[0] as HTMLElement).style.display = 'grid';
}

// ─── European interactive table ─────────────────────────────
let eurAllRows: EurRow[] = [];
let eurFiltered: EurRow[] = [];
let eurPage = 0;
const EUR_PAGE = 25;

async function initEurTable(): Promise<void> {
  const raw: CsvRow[] = await new Promise((resolve, reject) => {
    Papa.parse('/csvs/o5/europeo_todos.csv', {
      download: true, header: true, dynamicTyping: false,
      complete: (r) => resolve(r.data as CsvRow[]),
      error: reject
    });
  });

  eurAllRows = (raw as unknown as EurRow[]).filter(r => r.Titulo && String(r.Titulo).trim());
  eurFiltered = [...eurAllRows];

  populateEurCCAA();
  renderEurTable();
  attachEurFilters();
}

function populateEurCCAA(): void {
  const sel = document.getElementById('eur-f-ccaa') as HTMLSelectElement | null;
  if (!sel) return;
  const vals = [...new Set(eurAllRows.map(r => r.CCAA).filter(Boolean))].sort();
  vals.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = v;
    sel.appendChild(opt);
  });
}

function applyEurFilters(): void {
  const search = ((document.getElementById('eur-f-search') as HTMLInputElement)?.value ?? '').toLowerCase();
  const ccaa  = (document.getElementById('eur-f-ccaa')  as HTMLSelectElement)?.value ?? '';
  const tipo  = (document.getElementById('eur-f-tipo')  as HTMLSelectElement)?.value ?? '';
  const anio  = (document.getElementById('eur-f-anio')  as HTMLSelectElement)?.value ?? '';
  const ods   = (document.getElementById('eur-f-ods')   as HTMLSelectElement)?.value ?? '';

  eurFiltered = eurAllRows.filter(r => {
    if (search && !r.Titulo.toLowerCase().includes(search) && !r.Beneficiario.toLowerCase().includes(search)) return false;
    if (ccaa && r.CCAA !== ccaa) return false;
    if (tipo && r.Tipo !== tipo) return false;
    if (anio && r.Anio !== anio) return false;
    if (ods && !r.ODS.split(' ').includes(ods)) return false;
    return true;
  });
  eurPage = 0;
  renderEurTable();
}

function renderEurTable(): void {
  const tbody   = document.getElementById('eur-tbody');
  const infoEl  = document.getElementById('eur-info');
  const prevBtn = document.getElementById('eur-prev') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('eur-next') as HTMLButtonElement | null;
  if (!tbody) return;

  const total      = eurFiltered.length;
  const totalPages = Math.max(1, Math.ceil(total / EUR_PAGE));
  const start      = eurPage * EUR_PAGE;
  const end        = Math.min(start + EUR_PAGE, total);

  tbody.innerHTML = eurFiltered.slice(start, end).map(r => {
    const odsBadges = (r.ODS ? r.ODS.split(' ').filter(Boolean) : [])
      .map(o => `<span class="ods-num-badge" style="background:${odsColorMap[o] ?? '#999'}" title="${o}">${o.replace('ODS', '')}</span>`)
      .join('');
    const cuantiaFmt = r.Cuantia && Number(r.Cuantia) > 0
      ? Number(r.Cuantia).toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' €' : '—';
    const tipoBadge = r.Tipo === 'Horizonte 2020'
      ? `<span class="tipo-badge-mini h2020">H2020</span>`
      : `<span class="tipo-badge-mini heur">H.Eur</span>`;
    const titulo = r.Titulo.replace(/"/g, '&quot;');
    const uni = r.Beneficiario.replace(/"/g, '&quot;');

    return `<tr>
      <td class="td-anio">${r.Anio}</td>
      <td class="td-tipo">${tipoBadge}</td>
      <td class="td-titulo"><span title="${titulo}">${r.Titulo}</span></td>
      <td class="td-uni"><span title="${uni}">${r.Beneficiario}</span></td>
      <td class="td-ccaa">${r.CCAA}</td>
      <td class="td-cuantia">${cuantiaFmt}</td>
      <td class="td-ods">${odsBadges}</td>
    </tr>`;
  }).join('');

  if (infoEl) {
    const label = total !== eurAllRows.length
      ? `${total.toLocaleString('es-ES')} de ${eurAllRows.length.toLocaleString('es-ES')} proyectos`
      : `${total.toLocaleString('es-ES')} proyectos`;
    infoEl.textContent = `${label} · página ${eurPage + 1} / ${totalPages}`;
  }
  if (prevBtn) prevBtn.disabled = eurPage === 0;
  if (nextBtn) nextBtn.disabled = end >= total;
}

function attachEurFilters(): void {
  ['eur-f-search', 'eur-f-ccaa', 'eur-f-tipo', 'eur-f-anio', 'eur-f-ods'].forEach(id => {
    const el = document.getElementById(id);
    el?.addEventListener('input', applyEurFilters);
    el?.addEventListener('change', applyEurFilters);
  });
  document.getElementById('eur-reset')?.addEventListener('click', () => {
    (document.getElementById('eur-f-search') as HTMLInputElement).value = '';
    ['eur-f-ccaa', 'eur-f-tipo', 'eur-f-anio', 'eur-f-ods'].forEach(id => {
      (document.getElementById(id) as HTMLSelectElement).value = '';
    });
    applyEurFilters();
  });
  document.getElementById('eur-prev')?.addEventListener('click', () => { eurPage--; renderEurTable(); });
  document.getElementById('eur-next')?.addEventListener('click', () => { eurPage++; renderEurTable(); });
}

// ─── Boot ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('o5-dashboard')) return;

  initTabla1Tabs();
  initEurTable();

  Promise.all([
    buildChart('chart-nat-anio', {
      chartType: 'bar', csvPath: 'csvs/o5/nacional_por_anio.csv',
      title: 'Proyectos nacionales por año de convocatoria (2016–2023)',
      xKey: 'Anio', yKey: 'NProyectos', color: '#2B5E8E',
      datasetLabel: 'Proyectos', showLegend: false, xAxisLabel: 'proyectos'
    }),
    buildChart('chart-nat-ods', {
      chartType: 'bar', csvPath: 'csvs/o5/nacional_por_ods.csv',
      title: 'Proyectos nacionales por ODS — total 2016–2023',
      xKey: 'Nombre', yKey: 'NProyectos', indexAxis: 'y',
      groupKey: 'ODS', colorMap: odsColorMap,
      datasetLabel: 'Proyectos', showLegend: false, xAxisLabel: 'proyectos'
    }),
    buildChart('chart-nat-ccaa', {
      chartType: 'bar', csvPath: 'csvs/o5/nacional_por_ccaa.csv',
      title: 'Proyectos nacionales por Comunidad Autónoma',
      xKey: 'CCAA', yKey: 'NProyectos', indexAxis: 'y', color: '#2B5E8E',
      datasetLabel: 'Proyectos', showLegend: false, xAxisLabel: 'proyectos'
    }),
    buildChart('chart-eur-anio', {
      chartType: 'bar', csvPath: 'csvs/o5/europeo_por_anio.csv',
      title: 'Proyectos europeos por año (Horizonte 2020 · Horizonte Europa)',
      xKey: 'Anio', yKey: 'NProyectos',
      groupKey: 'Tipo', colorMap: horizonColorMap,
      datasetLabel: 'Proyectos', showLegend: false, xAxisLabel: 'proyectos'
    }),
    buildChart('chart-eur-ods', {
      chartType: 'bar', csvPath: 'csvs/o5/europeo_por_ods.csv',
      title: 'Proyectos europeos por ODS — total 2016–2024',
      xKey: 'Nombre', yKey: 'NProyectos', indexAxis: 'y',
      groupKey: 'ODS', colorMap: odsColorMap,
      datasetLabel: 'Proyectos', showLegend: false, xAxisLabel: 'proyectos'
    }),
  ]);
});
