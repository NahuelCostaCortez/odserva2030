import {
  Chart, BarController, LineController, CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, Title, Tooltip, Legend
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'hammerjs';
import Papa from 'papaparse';

// ─── Types ─────────────────────────────────────────────────
type CsvRow = Record<string, string | number | null | undefined>;
type ChartConfig = {
  chartType: 'bar' | 'line';
  csvPath: string;
  title: string;
  xKey: string;
  yKey?: string;
  yKeys?: string[];
  stacked?: boolean;
  indexAxis?: 'x' | 'y';
  pivotMode?: boolean;
  groupKey?: string;
  yMax?: number;
  barColor?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  datasetLabel?: string;
  showLegend?: boolean;
  colorMap?: Record<string, string>;
  zoomable?: boolean;
};

// ─── Constants ─────────────────────────────────────────────
const odsColorMap: Record<string, string> = {
  'AGENDA 2030': '#6EC1E4',
  ODS1: '#e03e4c', ODS2: '#d3a029', ODS3: '#4c9f38', ODS4: '#c43c44',
  ODS5: '#ff6b4a', ODS6: '#2a9fd6', ODS7: '#fcc30b', ODS8: '#b04364',
  ODS9: '#ff8c4a', ODS10: '#e3337e', ODS11: '#f6a53a', ODS12: '#bf8b2e',
  ODS13: '#5c9a63', ODS14: '#0a97d9', ODS15: '#56c02b', ODS16: '#2f7ea8',
  ODS17: '#1b4f72'
};

const lineSeriesStyles: Record<string, { color: string; dash: number[] }> = {
  'Universidad Publica': { color: '#6EC1E4', dash: [6, 3] },
  'Universidad Privada': { color: '#4472C4', dash: [6, 3] },
  'Total': { color: '#2E4A7A', dash: [] }
};

const odsNames: Record<string, string> = {
  ODS1: 'Fin de la pobreza', ODS2: 'Hambre cero', ODS3: 'Salud y bienestar',
  ODS4: 'Educacion de calidad', ODS5: 'Igualdad de genero', ODS6: 'Agua limpia y saneamiento',
  ODS7: 'Energia asequible', ODS8: 'Trabajo decente', ODS9: 'Industria e innovacion',
  ODS10: 'Reduccion de desigualdades', ODS11: 'Ciudades sostenibles', ODS12: 'Produccion responsable',
  ODS13: 'Accion por el clima', ODS14: 'Vida submarina', ODS15: 'Vida de ecosistemas terrestres',
  ODS16: 'Paz, justicia e instituciones', ODS17: 'Alianzas para los objetivos'
};

// Mapeo ODS → CSVs de Top 10
const odsTopMap: Record<string, { pct: string; mentions: string; yMaxPct: number; yMaxMen: number }> = {
  ODS1:  { pct: '_page_36_Figure_2', mentions: '_page_47_Figure_2', yMaxPct: 55, yMaxMen: 40 },
  ODS2:  { pct: '_page_37_Figure_2', mentions: '_page_47_Figure_3', yMaxPct: 5, yMaxMen: 25 },
  ODS3:  { pct: '_page_37_Figure_3', mentions: '_page_48_Figure_2', yMaxPct: 25, yMaxMen: 20 },
  ODS4:  { pct: '_page_38_Figure_2', mentions: '_page_48_Figure_3', yMaxPct: 105, yMaxMen: 22 },
  ODS5:  { pct: '_page_38_Figure_3', mentions: '_page_49_Figure_2', yMaxPct: 60, yMaxMen: 15 },
  ODS6:  { pct: '_page_39_Figure_2', mentions: '_page_49_Figure_3', yMaxPct: 4, yMaxMen: 12 },
  ODS7:  { pct: '_page_39_Figure_3', mentions: '_page_50_Figure_2', yMaxPct: 5, yMaxMen: 8 },
  ODS8:  { pct: '_page_40_Figure_2', mentions: '_page_50_Figure_3', yMaxPct: 40, yMaxMen: 12 },
  ODS9:  { pct: '_page_40_Figure_3', mentions: '_page_51_Figure_2', yMaxPct: 55, yMaxMen: 16 },
  ODS10: { pct: '_page_41_Figure_2', mentions: '_page_51_Figure_3', yMaxPct: 85, yMaxMen: 24 },
  ODS11: { pct: '_page_41_Figure_3', mentions: '_page_52_Figure_2', yMaxPct: 12, yMaxMen: 5 },
  ODS12: { pct: '_page_42_Figure_2', mentions: '_page_52_Figure_3', yMaxPct: 20, yMaxMen: 4 },
  ODS13: { pct: '_page_42_Figure_3', mentions: '_page_53_Figure_2', yMaxPct: 10, yMaxMen: 3 },
  ODS14: { pct: '_page_43_Figure_2', mentions: '_page_53_Figure_3', yMaxPct: 5, yMaxMen: 2 },
  ODS15: { pct: '_page_43_Figure_3', mentions: '_page_54_Figure_2', yMaxPct: 35, yMaxMen: 2 },
  ODS16: { pct: '_page_44_Figure_2', mentions: '_page_54_Figure_3', yMaxPct: 55, yMaxMen: 4 },
  ODS17: { pct: '_page_44_Figure_3', mentions: '_page_55_Figure_2', yMaxPct: 20, yMaxMen: 4 }
};

// ─── Chart.js setup ────────────────────────────────────────
Chart.register(
  BarController, LineController, CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, Title, Tooltip, Legend, zoomPlugin
);

Chart.defaults.font.family = "'Roboto Slab', serif";
Chart.defaults.color = '#000000';

// ─── CSV cache ─────────────────────────────────────────────
const csvCache = new Map<string, CsvRow[]>();

function resolvePublicPath(path: string): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  return `${base}${path.replace(/^\/+/, '')}`;
}

async function loadCsv(csvPath: string): Promise<CsvRow[]> {
  if (csvCache.has(csvPath)) return csvCache.get(csvPath)!;
  const url = resolvePublicPath(csvPath);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CSV ${url}: HTTP ${res.status}`);
  const text = await res.text();
  const parsed = Papa.parse<CsvRow>(text, { header: true, dynamicTyping: true, skipEmptyLines: true });
  const rows = parsed.data.filter(r => r && Object.keys(r).length > 0);
  csvCache.set(csvPath, rows);
  return rows;
}

// ─── Chart registry (for destroy) ──────────────────────────
const chartRegistry = new Map<string, Chart>();
const chartBuildVersions = new Map<string, number>();

function destroyChart(id: string, canvas?: HTMLCanvasElement) {
  const c = chartRegistry.get(id);
  if (c) { c.destroy(); chartRegistry.delete(id); }

  const existing = Chart.getChart(canvas ?? id);
  if (existing) existing.destroy();
}

// ─── Responsive font helper ────────────────────────────────
const getResponsiveFontSize = (ctx: any) => ({
  size: (ctx.scale.max - ctx.scale.min) > 40 ? 9 : 12
});

// ─── Unified chart builder ─────────────────────────────────
async function buildChart(canvasId: string, config: ChartConfig): Promise<Chart | null> {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return null;

  const buildVersion = (chartBuildVersions.get(canvasId) ?? 0) + 1;
  chartBuildVersions.set(canvasId, buildVersion);
  destroyChart(canvasId, canvas);

  const rows = await loadCsv(config.csvPath);
  if (chartBuildVersions.get(canvasId) !== buildVersion) return null;
  if (!rows.length) return null;

  const isHorizontal = config.indexAxis === 'y';
  let labels: string[];
  let datasets: any[];

  if (config.chartType === 'line') {
    labels = rows.map(r => String(r[config.xKey] ?? ''));
    const keys = config.yKeys ?? (config.yKey ? [config.yKey] : []);
    datasets = keys.map(key => {
      const style = lineSeriesStyles[key] ?? { color: config.barColor ?? '#4472C4', dash: [] };
      return {
        label: key,
        data: rows.map(r => { const v = r[key]; return v !== null && v !== undefined && v !== '' ? Number(v) : null; }),
        borderColor: style.color, backgroundColor: style.color,
        borderDash: style.dash, borderWidth: 2, pointRadius: 4,
        pointBackgroundColor: style.color, fill: false, tension: 0.1, spanGaps: false
      };
    });
  } else if (config.pivotMode) {
    labels = Object.keys(rows[0]).filter(k => k !== config.xKey);
    datasets = rows.map(row => {
      const label = String(row[config.xKey] ?? '');
      return {
        label, data: labels.map(col => Number(row[col] ?? 0)),
        backgroundColor: config.colorMap?.[label] ?? config.barColor ?? '#7a7a7a',
        borderWidth: 0, borderRadius: 0
      };
    });
  } else if (config.yKeys && config.yKeys.length > 0) {
    labels = rows.map(r => String(r[config.xKey] ?? ''));
    datasets = config.yKeys.map(key => ({
      label: key, data: rows.map(r => Number(r[key] ?? 0)),
      backgroundColor: config.colorMap?.[key] ?? config.barColor ?? '#7a7a7a',
      borderWidth: 0, borderRadius: config.stacked ? 0 : 4
    }));
  } else if (config.stacked && config.groupKey) {
    const catKey = config.xKey, grpKey = config.groupKey, valKey = config.yKey || '';
    labels = Array.from(new Set(rows.map(r => String(r[catKey] ?? ''))));
    const groups = Array.from(new Set(rows.map(r => String(r[grpKey] ?? '')))).sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, '')), nb = parseInt(b.replace(/\D/g, ''));
      return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
    });
    const dm = new Map<string, number>();
    rows.forEach(r => {
      const k = `${String(r[catKey] ?? '')}|${String(r[grpKey] ?? '')}`;
      dm.set(k, (dm.get(k) || 0) + Number(r[valKey] ?? 0));
    });
    datasets = groups.map(g => ({
      label: g, data: labels.map(l => dm.get(`${l}|${g}`) ?? 0),
      backgroundColor: config.colorMap?.[g] ?? config.barColor ?? '#7a7a7a',
      borderWidth: 0, borderRadius: 0
    }));
  } else {
    labels = rows.map(r => String(r[config.xKey] ?? ''));
    const valKey = config.yKey || '';
    const values = rows.map(r => Number(r[valKey] ?? 0));
    const grps = rows.map(r => String(r[config.groupKey ?? ''] ?? ''));
    const fc = config.barColor ?? '#7a7a7a';
    const colors = rows.map((_, i) => (config.groupKey && config.colorMap?.[grps[i]]) ? config.colorMap[grps[i]] : fc);
    datasets = [{ label: config.datasetLabel || valKey, data: values, backgroundColor: colors, borderWidth: 0, borderRadius: 4 }];
  }

  // Options
  const opts: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: config.showLegend ?? (!!config.yKeys), position: 'bottom' },
      title: { display: true, text: config.title, font: { size: 16, weight: 'bold' }, padding: { bottom: 16 } },
      tooltip: { enabled: true },
      zoom: {
        limits: { y: { min: 0, max: (config.yMax || 100) * 1.1 } },
        pan: { enabled: config.zoomable !== false, mode: 'xy', threshold: 10 },
        zoom: { wheel: { enabled: config.zoomable !== false }, pinch: { enabled: config.zoomable !== false }, mode: 'xy' }
      }
    },
    layout: { padding: { left: 0, right: 20, bottom: 10 } }
  };

  if (config.chartType === 'line') {
    opts.plugins.zoom.pan.mode = 'x';
    opts.plugins.zoom.zoom.mode = 'x';
    opts.scales = {
      y: { beginAtZero: true, max: config.yMax, title: { display: !!config.yAxisLabel, text: config.yAxisLabel ?? '', font: { weight: 'bold' } }, grid: { color: '#f0f0f0' } },
      x: { ticks: { font: getResponsiveFontSize }, title: { display: !!config.xAxisLabel, text: config.xAxisLabel ?? '', font: { weight: 'bold' } }, grid: { display: false } }
    };
  } else if (isHorizontal) {
    const wrapper = canvas.parentElement;
    if (wrapper) wrapper.style.height = '700px';
    opts.plugins.zoom.pan.mode = 'y';
    opts.plugins.zoom.zoom.mode = 'y';
    opts.plugins.zoom.limits = { y: { min: 0, max: labels.length - 1, minRange: 5 } };
    opts.scales = {
      x: { stacked: config.stacked, beginAtZero: true, max: config.yMax, title: { display: true, text: config.xAxisLabel ?? '', font: { weight: 'bold' } }, grid: { color: '#f0f0f0' }, ticks: { precision: 0, stepSize: 1, callback: (v: any) => Math.floor(v) === v ? v : undefined } },
      y: { stacked: config.stacked, min: 0, max: Math.min(24, labels.length - 1), afterFit: (s: any) => { s.width = 300; }, ticks: { autoSkip: false, font: getResponsiveFontSize }, title: { display: true, text: config.yAxisLabel ?? '', font: { weight: 'bold' } }, grid: { display: false } }
    };
  } else {
    const zoomMode = 'x';
    opts.plugins.zoom.pan.mode = zoomMode;
    opts.plugins.zoom.zoom.mode = zoomMode;
    opts.scales = {
      y: { afterFit: (s: any) => { s.width = 80; }, stacked: config.stacked, beginAtZero: true, max: config.yMax, title: { display: true, text: config.yAxisLabel ?? '', font: { weight: 'bold' } }, grid: { color: '#f0f0f0' }, ticks: { precision: 0, stepSize: 1, callback: (v: any) => Math.floor(v) === v ? v : undefined } },
      x: { stacked: config.stacked, ticks: { align: 'start', maxRotation: 90, minRotation: 90, autoSkip: false, font: getResponsiveFontSize }, title: { display: true, text: config.xAxisLabel ?? '', font: { weight: 'bold' } }, grid: { display: false } }
    };
  }

  destroyChart(canvasId, canvas);
  const chart = new Chart(canvas, {
    type: config.chartType, data: { labels, datasets },
    options: { ...opts, indexAxis: config.indexAxis ?? 'x' }
  });

  chartRegistry.set(canvasId, chart);
  return chart;
}

// ─── State ─────────────────────────────────────────────────
let currentOds = 'ODS1';
let currentMetric: 'pct' | 'mentions' = 'pct';

// ─── Event system ──────────────────────────────────────────
function selectOds(odsKey: string) {
  currentOds = odsKey;
  document.dispatchEvent(new CustomEvent('ods-selected', { detail: { odsKey } }));
}

function onOdsSelected(cb: (odsKey: string) => void) {
  document.addEventListener('ods-selected', ((e: CustomEvent) => cb(e.detail.odsKey)) as EventListener);
}

// ─── UI: Tabs ──────────────────────────────────────────────
function initTabs(containerId: string, onActivate?: (panelKey: string) => void) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const buttons = container.querySelectorAll<HTMLElement>('.chart-tab');
  const section = container.closest('.dash-section')!;
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.tab!;
      buttons.forEach(b => b.classList.toggle('active', b === btn));
      section.querySelectorAll<HTMLElement>('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === key));
      onActivate?.(key);
    });
  });
}

// ─── UI: Stepper ───────────────────────────────────────────
function initStepper(containerId: string, onStep?: (step: number) => void) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const panels = container.querySelectorAll<HTMLElement>('.step-panel');
  const indicator = container.querySelector<HTMLElement>('.step-indicator');
  const prevBtn = container.querySelector<HTMLButtonElement>('#step-prev');
  const nextBtn = container.querySelector<HTMLButtonElement>('#step-next');
  let step = 0;
  const total = panels.length;

  function go(s: number) {
    step = Math.max(0, Math.min(s, total - 1));
    panels.forEach((p, i) => p.classList.toggle('active', i === step));
    if (indicator) indicator.textContent = `${step + 1} / ${total}`;
    if (prevBtn) prevBtn.disabled = step === 0;
    if (nextBtn) nextBtn.disabled = step === total - 1;
    onStep?.(step);
  }

  prevBtn?.addEventListener('click', () => go(step - 1));
  nextBtn?.addEventListener('click', () => go(step + 1));
  go(0);
}

// ─── Section: LOSU ─────────────────────────────────────────
async function initLosuChart() {
  await buildChart('chart-losu', {
    chartType: 'bar', csvPath: 'csvs/o1/_page_22_Figure_2.csv',
    title: 'Peso relativo de cada ODS en la LOSU',
    xKey: 'ODS', yKey: 'Porcentaje', groupKey: 'ODS', yMax: 35,
    xAxisLabel: 'ODS', yAxisLabel: 'Porcentaje', colorMap: odsColorMap
  });
}

// ─── Section: Master chart + ODS grid + detail + Top10 ─────
async function initMasterChart() {
  const chart = await buildChart('chart-master', {
    chartType: 'bar', csvPath: 'csvs/o1/_page_28_Figure_2.csv',
    title: 'Grado de implicacion de las universidades con los ODS',
    xKey: 'Universidad', groupKey: 'ODS', yKey: 'Presencia',
    indexAxis: 'y', stacked: true, xAxisLabel: 'Numero de ODS',
    yAxisLabel: 'Universidad', yMax: 17, showLegend: true, colorMap: odsColorMap
  });
  // Click on bars to select ODS
  if (chart) {
    const origClick = chart.options.onClick;
    chart.options.onClick = (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const dsIndex = elements[0].datasetIndex;
        const odsKey = chart.data.datasets[dsIndex]?.label;
        if (odsKey && odsKey.startsWith('ODS')) selectOds(odsKey);
      }
    };
    chart.update();
  }
}

function initOdsGrid() {
  const grid = document.getElementById('ods-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 1; i <= 17; i++) {
    const key = `ODS${i}`;
    const btn = document.createElement('button');
    btn.className = `ods-btn${key === currentOds ? ' active' : ''}`;
    btn.dataset.ods = key;
    btn.style.setProperty('--ods-color', odsColorMap[key]);
    btn.innerHTML = `<span class="ods-btn-num">${i}</span>`;
    btn.title = `${key}: ${odsNames[key]}`;
    btn.addEventListener('click', () => selectOds(key));
    grid.appendChild(btn);
  }
  onOdsSelected(odsKey => {
    grid.querySelectorAll<HTMLElement>('.ods-btn').forEach(b => b.classList.toggle('active', b.dataset.ods === odsKey));
  });
}

// Pre-loaded data for detail panel
let detailData: {
  losu: CsvRow[];
  media: CsvRow[];
  targets: CsvRow[];
  top10metas: CsvRow[];
} | null = null;

async function loadDetailData() {
  if (detailData) return detailData;
  const [losu, media, targets, top10metas] = await Promise.all([
    loadCsv('csvs/o1/_page_22_Figure_2.csv'),
    loadCsv('csvs/o1/_page_29_Figure_2.csv'),
    loadCsv('csvs/o1/_page_30_Figure_2.csv'),
    loadCsv('csvs/o1/_page_32_Figure_2.csv')
  ]);
  detailData = { losu, media, targets, top10metas };
  return detailData;
}

async function updateOdsDetail(odsKey: string) {
  const panel = document.getElementById('ods-detail');
  if (!panel) return;
  try {
    const d = await loadDetailData();
    const losuRow = d.losu.find(r => String(r['ODS']) === odsKey);
    const mediaRow = d.media.find(r => String(r['ODS']) === odsKey);
    const targetsFiltered = d.targets.filter(r => String(r['ODS']) === odsKey);
    const topMetas = d.top10metas.filter(r => String(r['ODS']) === odsKey).slice(0, 3);

    const pesoLosu = losuRow ? Number(losuRow['Porcentaje'] ?? 0).toFixed(1) : '—';
    const cobMedia = mediaRow ? Number(mediaRow['Cobertura media (%)'] ?? 0).toFixed(1) : '—';
    const numTargets = targetsFiltered.length;
    const metasHtml = topMetas.map(m =>
      `<li>${String(m['Target especifico'] ?? '—')} <span class="meta-freq">(${m['Frecuencia'] ?? m['Valores'] ?? '—'})</span></li>`
    ).join('');

    panel.innerHTML = `
      <div class="detail-header">
        <span class="detail-ods-badge" style="background:${odsColorMap[odsKey]}">${odsKey}</span>
        <span class="detail-ods-name">${odsNames[odsKey] || ''}</span>
      </div>
      <div class="detail-stats">
        <div class="detail-stat"><div class="detail-stat-val">${pesoLosu}%</div><div class="detail-stat-lbl">Peso en LOSU</div></div>
        <div class="detail-stat"><div class="detail-stat-val">${cobMedia}%</div><div class="detail-stat-lbl">Cobertura media</div></div>
        <div class="detail-stat"><div class="detail-stat-val">${numTargets}</div><div class="detail-stat-lbl">Targets especificos</div></div>
      </div>
      ${topMetas.length ? `<div class="detail-metas"><div class="detail-metas-title">Top metas abordadas:</div><ul>${metasHtml}</ul></div>` : ''}
    `;
    panel.classList.add('visible');
  } catch (e) { console.error('Detail panel:', e); }
}

async function updateTop10() {
  const odsData = odsTopMap[currentOds];
  if (!odsData) return;
  const isPct = currentMetric === 'pct';
  const csvFile = isPct ? odsData.pct : odsData.mentions;
  const yMax = isPct ? odsData.yMaxPct : odsData.yMaxMen;
  const yKey = isPct ? 'Porcentaje de cumplimiento' : 'Numero de palabras';
  const yLabel = isPct ? 'Porcentaje de cumplimiento' : 'Numero de palabras';

  await buildChart('chart-top10', {
    chartType: 'bar', csvPath: `csvs/o1/${csvFile}.csv`,
    title: `Top 10 Universidades - ${currentOds} (${isPct ? '% Cumplimiento' : 'Menciones'})`,
    xKey: 'Universidad', yKey, yMax, xAxisLabel: 'Universidad', yAxisLabel: yLabel,
    barColor: odsColorMap[currentOds], datasetLabel: yLabel, showLegend: false
  });
}

function initMetricTabs() {
  const tabs = document.getElementById('metric-tabs');
  if (!tabs) return;
  tabs.querySelectorAll<HTMLElement>('.metric-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      currentMetric = btn.dataset.metric as 'pct' | 'mentions';
      tabs.querySelectorAll('.metric-tab').forEach(b => b.classList.toggle('active', b === btn));
      updateTop10();
    });
  });
}

// ─── Section: Cobertura tabs ───────────────────────────────
const coberturaInited = new Set<string>();
async function initCoberturaTabs() {
  const configs: Record<string, { id: string; cfg: ChartConfig }> = {
    media: {
      id: 'chart-cob-media', cfg: {
        chartType: 'bar', csvPath: 'csvs/o1/_page_29_Figure_2.csv',
        title: 'Peso relativo medio de cada ODS en los estatutos',
        xKey: 'ODS', yKey: 'Cobertura media (%)', groupKey: 'ODS', yMax: 40,
        xAxisLabel: 'ODS', yAxisLabel: 'Cobertura media (%)', colorMap: odsColorMap
      }
    },
    absoluta: {
      id: 'chart-cob-abs', cfg: {
        chartType: 'bar', csvPath: 'csvs/o1/_page_33_Figure_2.csv',
        title: 'Menciones por ODS en los estatutos universitarios',
        xKey: 'Universidad', yKeys: ['ODS1','ODS2','ODS3','ODS4','ODS5','ODS6','ODS7','ODS8','ODS9','ODS10','ODS11','ODS12','ODS13','ODS14','ODS15','ODS16','ODS17'],
        yMax: 70, xAxisLabel: 'Universidad', yAxisLabel: 'Cobertura (%)', showLegend: true, colorMap: odsColorMap
      }
    },
    relativa: {
      id: 'chart-cob-rel', cfg: {
        chartType: 'bar', csvPath: 'csvs/o1/_page_35_Figure_2.csv',
        title: 'Cobertura relativa por ODS en los estatutos universitarios (%)',
        xKey: 'Universidad', yKeys: ['ODS1','ODS2','ODS3','ODS4','ODS5','ODS6','ODS7','ODS8','ODS9','ODS10','ODS11','ODS12','ODS13','ODS14','ODS15','ODS16','ODS17'],
        yMax: 100, xAxisLabel: 'Universidad', yAxisLabel: 'Cobertura (%)', showLegend: true, colorMap: odsColorMap
      }
    }
  };

  async function activateTab(key: string) {
    if (coberturaInited.has(key)) return;
    const entry = configs[key];
    if (entry) { await buildChart(entry.id, entry.cfg); coberturaInited.add(key); }
  }

  initTabs('cobertura-tabs', activateTab);
  await activateTab('media'); // init first tab
}

// ─── Section: Targets stepper ──────────────────────────────
const targetsInited = new Set<number>();
async function initTargetsStepper() {
  const configs: ChartConfig[] = [
    { chartType: 'bar', csvPath: 'csvs/o1/_page_30_Figure_2.csv', title: 'Frecuencia de targets especificos por ODS', xKey: 'Target especifico', yKey: 'Valores', groupKey: 'ODS', yMax: 80, xAxisLabel: 'Target especifico', yAxisLabel: 'Valores', colorMap: odsColorMap },
    { chartType: 'bar', csvPath: 'csvs/o1/_page_31_Figure_2.csv', title: 'Targets ordenados por frecuencia', xKey: 'Target especifico', yKey: 'Frecuencia', groupKey: 'ODS', yMax: 80, xAxisLabel: 'Target especifico', yAxisLabel: 'Frecuencia', colorMap: odsColorMap },
    { chartType: 'bar', csvPath: 'csvs/o1/_page_32_Figure_2.csv', title: 'Las 10 metas especificas mas abordadas', xKey: 'Target especifico', yKey: 'Frecuencia', groupKey: 'ODS', yMax: 80, xAxisLabel: 'Target especifico', yAxisLabel: 'Frecuencia', colorMap: odsColorMap }
  ];
  const ids = ['chart-targets-1', 'chart-targets-2', 'chart-targets-3'];

  async function activateStep(step: number) {
    if (targetsInited.has(step)) return;
    targetsInited.add(step);
    await buildChart(ids[step], configs[step]);
  }

  initStepper('targets-stepper', activateStep);
}

// ─── Section: Extremos ─────────────────────────────────────
async function initExtremosCharts() {
  await Promise.all([
    buildChart('chart-extremos-mas', {
      chartType: 'bar', csvPath: 'csvs/o1/_page_56_Figure_2.csv',
      title: 'Universidades con mayor mencion de ODS', xKey: 'Universidad',
      yKey: 'Numero de palabras', yMax: 140, xAxisLabel: 'Universidad',
      yAxisLabel: 'Numero de palabras', barColor: '#6EC1E4', datasetLabel: 'Numero de palabras', showLegend: false
    }),
    buildChart('chart-extremos-menos', {
      chartType: 'bar', csvPath: 'csvs/o1/_page_57_Figure_2.csv',
      title: 'Universidades con menor mencion de ODS', xKey: 'Universidad',
      yKey: 'Numero de palabras', yMax: 10, xAxisLabel: 'Universidad',
      yAxisLabel: 'Numero de palabras', barColor: '#E07A5F', datasetLabel: 'Numero de palabras', showLegend: false
    })
  ]);
}

// ─── Section: Genero temporal tabs ─────────────────────────
const generoInited = new Set<string>();
async function initGeneroTabs() {
  const configs: Record<string, { id: string; cfg: ChartConfig }> = {
    rectora: { id: 'chart-gen-rectora', cfg: { chartType: 'line', csvPath: 'csvs/o1/_page_74_Figure_2.csv', title: 'Porcentaje de universidades con mujer rectora', xKey: 'Año', yKeys: ['Universidad Publica', 'Universidad Privada', 'Total'], yMax: 40, xAxisLabel: 'Ano', yAxisLabel: '%', showLegend: true } },
    gerente: { id: 'chart-gen-gerente', cfg: { chartType: 'line', csvPath: 'csvs/o1/_page_75_Figure_4.csv', title: 'Porcentaje de universidades con mujer gerente', xKey: 'Año', yKeys: ['Universidad Publica', 'Universidad Privada', 'Total'], yMax: 50, xAxisLabel: 'Ano', yAxisLabel: '%', showLegend: true } },
    'cr-mujeres': { id: 'chart-gen-cr', cfg: { chartType: 'line', csvPath: 'csvs/o1/_page_77_Figure_2.csv', title: 'Porcentaje de mujeres en el Consejo Rectoral', xKey: 'Año', yKeys: ['Universidad Publica', 'Universidad Privada', 'Total'], yMax: 60, xAxisLabel: 'Ano', yAxisLabel: '%', showLegend: true } },
    'cr-paridad': { id: 'chart-gen-paridad', cfg: { chartType: 'line', csvPath: 'csvs/o1/_page_78_Figure_2.csv', title: 'Universidades con paridad 40-60% en Consejo Rectoral', xKey: 'Año', yKeys: ['Universidad Publica', 'Universidad Privada', 'Total'], yMax: 85, xAxisLabel: 'Ano', yAxisLabel: '%', showLegend: true } }
  };

  async function activateTab(key: string) {
    if (generoInited.has(key)) return;
    const e = configs[key];
    if (e) { await buildChart(e.id, e.cfg); generoInited.add(key); }
  }
  initTabs('genero-tabs', activateTab);
  await activateTab('rectora');
}

async function initGeneroComplementarios() {
  await Promise.all([
    buildChart('chart-gen-tipo', {
      chartType: 'bar', csvPath: 'csvs/o1/_page_74_Figure_4.csv',
      title: 'Tipo de universidad y presencia femenina en rectorado',
      xKey: 'Tipo', yKey: 'Porcentaje de universidades', yMax: 75,
      groupKey: 'Tipo', colorMap: { 'Publica': '#6EC1E4', 'Privada': '#5B8FD6', 'Total': '#3A3F9E' }
    }),
    buildChart('chart-gen-hist', {
      chartType: 'bar', csvPath: 'csvs/o1/_page_77_Figure_4.csv',
      title: 'Distribucion % mujeres en Consejos Rectorales 2025',
      xKey: 'Rango de mujeres en Consejo Rectoral', yKey: 'Porcentaje de universidades',
      yMax: 50, barColor: '#6EC1E4', datasetLabel: 'Porcentaje de universidades', showLegend: false
    })
  ]);
}

// ─── Section: CCAA tabs ────────────────────────────────────
const ccaaInited = new Set<string>();
async function initCcaaTabs() {
  const configs: Record<string, { id: string; cfg: ChartConfig }> = {
    'ccaa-rectora': { id: 'chart-ccaa-1', cfg: { chartType: 'bar', csvPath: 'csvs/o1/_page_75_Figure_2.csv', title: 'CCAA que nunca han tenido mujer rectora', xKey: 'CCAA', yKey: 'Porcentaje de universidades', yMax: 100, indexAxis: 'y', barColor: '#6EC1E4' } },
    'ccaa-cr': { id: 'chart-ccaa-2', cfg: { chartType: 'bar', csvPath: 'csvs/o1/_page_78_Figure_4.csv', title: 'Representacion femenina en CR por CCAA', xKey: 'CCAA', yKey: 'Porcentaje de mujeres en Consejo Rectoral', yMax: 75, indexAxis: 'y', barColor: '#6EC1E4' } },
    'ccaa-tamano': { id: 'chart-ccaa-3', cfg: { chartType: 'bar', csvPath: 'csvs/o1/_page_81_Figure_2.csv', title: 'Miembros CR por 1000 alumnos, por CCAA', xKey: 'CCAA', yKey: 'Miembros en Consejo Rectoral por cada 1000 alumnos', yMax: 1.2, indexAxis: 'y', barColor: '#6EC1E4' } }
  };

  async function activateTab(key: string) {
    if (ccaaInited.has(key)) return;
    const e = configs[key];
    if (e) { await buildChart(e.id, e.cfg); ccaaInited.add(key); }
  }
  initTabs('ccaa-tabs', activateTab);
  await activateTab('ccaa-rectora');
}

// ─── Section: Tamano organos ───────────────────────────────
async function initTamanoCharts() {
  await Promise.all([
    buildChart('chart-tam-prom', {
      chartType: 'line', csvPath: 'csvs/o1/_page_80_Figure_2.csv',
      title: 'Promedio miembros en Consejo Rectoral',
      xKey: 'Año', yKeys: ['Universidad Publica', 'Universidad Privada', 'Total'],
      yMax: 15, xAxisLabel: 'Ano', yAxisLabel: 'Promedio miembros', showLegend: true
    }),
    buildChart('chart-tam-1000', {
      chartType: 'line', csvPath: 'csvs/o1/_page_80_Figure_4.csv',
      title: 'Miembros CR por cada 1000 alumnos',
      xKey: 'Año', yKeys: ['Universidad Publica', 'Universidad Privada'],
      yMax: 0.7, xAxisLabel: 'Ano', yAxisLabel: 'Miembros / 1000 alumnos', showLegend: true
    })
  ]);
}

// ─── Section: Sostenibilidad ───────────────────────────────
async function initSostenibilidadCharts() {
  await Promise.all([
    buildChart('chart-sost-vice', {
      chartType: 'line', csvPath: 'csvs/o1/_page_83_Figure_2.csv',
      title: '% universidades con vicerrectorado en sostenibilidad',
      xKey: 'Año', yKeys: ['Universidad Publica', 'Universidad Privada', 'Total'],
      yMax: 100, xAxisLabel: 'Ano', yAxisLabel: '%', showLegend: true
    }),
    buildChart('chart-sost-tamano', {
      chartType: 'line', csvPath: 'csvs/o1/_page_83_Figure_4.csv',
      title: 'Vicerrectorado sostenibilidad por tamano universidad',
      xKey: 'Alumnos Matriculados', yKeys: ['Universidad Publica', 'Universidad Privada'],
      yMax: 100, xAxisLabel: 'Alumnos Matriculados', yAxisLabel: '%', showLegend: true
    })
  ]);
  await buildChart('chart-sost-ods', {
    chartType: 'bar', csvPath: 'csvs/o1/_page_84_Figure_2.csv',
    title: 'Porcentaje de vicerrectorados que mencionan cada ODS',
    xKey: 'ODS', yKey: 'Porcentaje de vicerrectorados', yMax: 80,
    indexAxis: 'y', groupKey: 'ODS', colorMap: odsColorMap
  });
  await Promise.all([
    buildChart('chart-sost-dir', {
      chartType: 'line', csvPath: 'csvs/o1/_page_86_Figure_2.csv',
      title: '% universidades con director de area en sostenibilidad',
      xKey: 'Año', yKeys: ['Universidad Publica', 'Universidad Privada', 'Total'],
      yMax: 75, xAxisLabel: 'Ano', yAxisLabel: '%', showLegend: true
    }),
    buildChart('chart-sost-comision', {
      chartType: 'line', csvPath: 'csvs/o1/_page_86_Figure_4.csv',
      title: '% universidades con comision de sostenibilidad',
      xKey: 'Año', yKeys: ['Universidad Publica', 'Universidad Privada', 'Total'],
      yMax: 35, xAxisLabel: 'Ano', yAxisLabel: '%', showLegend: true
    })
  ]);
}

// ─── Conclusiones ──────────────────────────────────────────
function initConclusiones() {
  const el = document.getElementById('conclusions');
  if (!el) return;
  const items = [
    'El ODS 4 (Educacion de calidad) es el mas presente tanto en la LOSU como en los estatutos universitarios, seguido del ODS 5 (Igualdad de genero) y ODS 10 (Reduccion de desigualdades).',
    'Los ODS medioambientales (6, 7, 13, 14, 15) tienen una presencia significativamente menor en la normativa universitaria, evidenciando un sesgo hacia los objetivos sociales.',
    'Existe una gran heterogeneidad entre universidades: algunas cubren mas del 50% de los targets de ciertos ODS, mientras otras apenas alcanzan el 5%.',
    'La representacion femenina en organos de gobierno ha mejorado progresivamente, pero aun no alcanza la paridad 40-60% en la mayoria de universidades.',
    'El porcentaje de universidades con estructuras dedicadas a sostenibilidad (vicerrectorados, comisiones) ha crecido notablemente desde 2020, especialmente en las publicas.'
  ];
  el.innerHTML = items.map(t => `<blockquote><p>${t}</p></blockquote>`).join('');
}

// ─── Main init ─────────────────────────────────────────────
async function initO1Dashboard() {
  // LOSU chart
  await initLosuChart();

  // Hub central: master + ODS grid + detail + Top10
  initOdsGrid();
  initMetricTabs();
  onOdsSelected(async (odsKey) => {
    await updateOdsDetail(odsKey);
    await updateTop10();
  });

  await initMasterChart();
  // Trigger initial ODS selection
  selectOds('ODS1');

  // Cobertura tabs
  await initCoberturaTabs();

  // Targets stepper
  await initTargetsStepper();

  // Extremos
  await initExtremosCharts();

  // Genero
  await initGeneroTabs();
  await initGeneroComplementarios();
  await initCcaaTabs();

  // Tamano
  await initTamanoCharts();

  // Sostenibilidad
  await initSostenibilidadCharts();

  // Conclusiones
  initConclusiones();
}

// Auto-init
if (document.getElementById('o1-dashboard')) {
  initO1Dashboard();
}
