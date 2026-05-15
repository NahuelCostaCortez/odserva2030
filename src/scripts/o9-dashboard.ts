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
};

const odsColorMap: Record<string, string> = {
  ODS1: '#e03e4c', ODS2: '#d3a029', ODS3: '#4c9f38', ODS4: '#c43c44',
  ODS5: '#ff6b4a', ODS6: '#2a9fd6', ODS7: '#fcc30b', ODS8: '#b04364',
  ODS9: '#ff8c4a', ODS10: '#e3337e', ODS11: '#f6a53a', ODS12: '#bf8b2e',
  ODS13: '#5c9a63', ODS14: '#0a97d9', ODS15: '#56c02b', ODS16: '#2f7ea8',
  ODS17: '#1b4f72'
};

Chart.register(BarController, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

async function buildChart(canvasId: string, cfg: ChartConfig): Promise<void> {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;

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
    : validRows.map(() => cfg.colorMap ? Object.values(cfg.colorMap)[0] : 'var(--brand, #2B5E8E)');

  new Chart(canvas, {
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
        title: {
          display: true, text: cfg.title,
          color: '#1a2e1a', font: { size: 12, weight: 500 as const }
        },
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
        x: {
          max: cfg.indexAxis === 'y' ? cfg.yMax : undefined,
          ticks: { font: { size: 11 } },
          grid: { display: cfg.indexAxis !== 'y' }
        },
        y: {
          max: cfg.indexAxis !== 'y' ? cfg.yMax : undefined,
          ticks: { font: { size: 11 } },
          grid: { display: cfg.indexAxis === 'y' }
        }
      }
    }
  });
}

// ─── Init: Resultados charts ────────────────────────────────
async function initResultadosCharts() {
  await Promise.all([
    buildChart('chart-proyectos-ods', {
      chartType: 'bar',
      csvPath: 'csvs/o9/proyectos_por_ods.csv',
      title: 'Nº proyectos financiados por ODS (convocatorias nacionales 2016–2023)',
      xKey: 'Nombre', yKey: 'Proyectos',
      indexAxis: 'y',
      groupKey: 'ODS', colorMap: odsColorMap,
      datasetLabel: 'Nº proyectos', showLegend: false,
      xAxisLabel: 'proyectos'
    }),
    buildChart('chart-financiacion-ods', {
      chartType: 'bar',
      csvPath: 'csvs/o9/financiacion_pico_ods.csv',
      title: '% financiación máxima alcanzada por ODS (pico periodo 2016–2023)',
      xKey: 'Nombre', yKey: 'Pico_pct',
      indexAxis: 'y',
      groupKey: 'ODS', colorMap: odsColorMap,
      yMax: 40,
      datasetLabel: '% financiación pico', showLegend: false,
      xAxisLabel: '%'
    })
  ]);
}

// ─── Init: ODS detail tabs ──────────────────────────────────
function initOdsTabs() {
  const tabs = document.querySelectorAll<HTMLButtonElement>('#o9-dashboard .ods-tab');
  const panels = document.querySelectorAll<HTMLElement>('#o9-dashboard .ods-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => (p.style.display = 'none'));
      tab.classList.add('active');
      const target = document.getElementById(`ods-panel-${tab.dataset.ods}`);
      if (target) target.style.display = 'block';
    });
  });

  if (panels.length) (panels[0] as HTMLElement).style.display = 'block';
}

// ─── Init: Buenas prácticas filter ─────────────────────────
function initPracticasFilter() {
  const filterBtns = document.querySelectorAll<HTMLButtonElement>('#o9-dashboard .practica-filter');
  const cards = document.querySelectorAll<HTMLElement>('#o9-dashboard .practica-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter ?? 'all';
      cards.forEach(card => {
        const odsArr = (card.dataset.ods ?? '').split(' ');
        const show = filter === 'all' || odsArr.includes(filter);
        card.style.display = show ? '' : 'none';
      });
    });
  });
}

// ─── Boot ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('o9-dashboard')) return;
  initResultadosCharts();
  initOdsTabs();
  initPracticasFilter();
});
