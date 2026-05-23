import {
  Chart, BarController, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js';
import Papa from 'papaparse';

type CsvRow = Record<string, string | number | null | undefined>;
type ChartConfig = {
  csvPath: string;
  title: string;
  xKey: string;
  yKey: string;
  groupKey?: string;
  colorMap?: Record<string, string>;
  yMax?: number;
  xAxisLabel?: string;
  color?: string;
};

const odsColorMap: Record<string, string> = {
  ODS1: '#e03e4c', ODS2: '#d3a029', ODS3: '#4c9f38', ODS4: '#c43c44',
  ODS5: '#ff6b4a', ODS6: '#2a9fd6', ODS7: '#fcc30b', ODS8: '#b04364',
  ODS9: '#ff8c4a', ODS10: '#e3337e', ODS11: '#f6a53a', ODS12: '#bf8b2e',
  ODS13: '#5c9a63', ODS14: '#0a97d9', ODS15: '#56c02b', ODS16: '#2f7ea8',
  ODS17: '#1b4f72'
};

Chart.register(BarController, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

async function buildHBarChart(canvasId: string, cfg: ChartConfig): Promise<void> {
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
    : validRows.map(() => cfg.color ?? '#2B5E8E');

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: cfg.title,
        data: values,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 0,
        borderRadius: 3
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: !!cfg.title,
          text: cfg.title,
          color: '#1a2e3a',
          font: { size: 12, weight: 500 as const }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${Number(ctx.parsed.x).toLocaleString('es-ES')}${cfg.xAxisLabel ? ' ' + cfg.xAxisLabel : ''}`
          }
        }
      },
      scales: {
        x: {
          max: cfg.yMax,
          ticks: { font: { size: 11 }, callback: (v) => `${v}${cfg.xAxisLabel ?? ''}` },
          grid: { display: false }
        },
        y: {
          ticks: { font: { size: 11 } },
          grid: { color: 'rgba(0,0,0,0.06)' }
        }
      }
    }
  });
}

function initTabs(containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;
  const btns = container.querySelectorAll<HTMLButtonElement>('[data-tab]');
  const panels = container.querySelectorAll<HTMLElement>('[data-panel]');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.tab!;
      btns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => { p.style.display = 'none'; });
      btn.classList.add('active');
      const target = container.querySelector<HTMLElement>(`[data-panel="${key}"]`);
      if (target) target.style.display = 'block';
    });
  });
}

function initAccordion(): void {
  document.querySelectorAll<HTMLElement>('.o3-univ-card').forEach(card => {
    card.querySelector<HTMLButtonElement>('.o3-univ-toggle')?.addEventListener('click', () => {
      const isOpen = card.classList.contains('open');
      document.querySelectorAll<HTMLElement>('.o3-univ-card').forEach(c => c.classList.remove('open'));
      if (!isOpen) card.classList.add('open');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('o3-dashboard')) return;

  buildHBarChart('chart-contextos', {
    csvPath: 'csvs/o3/contextos_formativos.csv',
    title: 'Universidades que ofrecen cada tipo de formación (n=26, %)',
    xKey: 'categoria',
    yKey: 'porcentaje',
    yMax: 100,
    xAxisLabel: '%',
    color: '#2B5E8E',
  });

  buildHBarChart('chart-ods-menciones', {
    csvPath: 'csvs/o3/ods_menciones.csv',
    title: 'ODS más presentes en la oferta formativa — n.º de menciones (n=26)',
    xKey: 'label',
    yKey: 'menciones',
    groupKey: 'ODS',
    colorMap: odsColorMap,
    xAxisLabel: ' menciones',
  });

  initTabs('o3-cuestionarios-tabs');
  initAccordion();
});
