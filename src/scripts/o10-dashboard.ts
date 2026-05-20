import {
  Chart, BarController, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js';
import Papa from 'papaparse';

type CsvRow = Record<string, string | number | null | undefined>;

type ChartConfig = {
  csvPath: string;
  title?: string;
  xKey: string;
  yKey?: string;
  yKeys?: string[];
  groupKey?: string;
  colorMap?: Record<string, string>;
  barColor?: string;
  yMax?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
  datasetLabel?: string;
  showLegend?: boolean;
  indexAxis?: 'x' | 'y';
  stacked?: boolean;
};

const odsColorMap: Record<string, string> = {
  ODS1: '#e03e4c', ODS2: '#d3a029', ODS3: '#4c9f38', ODS4: '#c43c44',
  ODS5: '#ff6b4a', ODS6: '#2a9fd6', ODS7: '#fcc30b', ODS8: '#b04364',
  ODS9: '#ff8c4a', ODS10: '#e3337e', ODS11: '#f6a53a', ODS12: '#bf8b2e',
  ODS13: '#5c9a63', ODS14: '#0a97d9', ODS15: '#56c02b', ODS16: '#2f7ea8',
  ODS17: '#1b4f72'
};

Chart.register(BarController, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const chartRegistry = new Map<string, Chart>();

async function loadCSV(csvPath: string): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(`/${csvPath}`, {
      download: true, header: true, dynamicTyping: true, skipEmptyLines: true,
      complete: (r) => resolve(r.data as CsvRow[]),
      error: reject
    });
  });
}

async function buildChart(canvasId: string, cfg: ChartConfig): Promise<void> {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;

  const existing = chartRegistry.get(canvasId);
  if (existing) { existing.destroy(); chartRegistry.delete(canvasId); }

  const rows = await loadCSV(cfg.csvPath);
  const isHorizontal = cfg.indexAxis === 'y';
  const defaultPalette = ['#3397c5', '#f39a32', '#58d68d', '#5dade2', '#ee6a5f', '#bfbfbf'];

  let labels: string[];
  let datasets: any[];

  if (cfg.yKeys && cfg.yKeys.length > 0) {
    labels = rows.map(r => String(r[cfg.xKey] ?? ''));
    datasets = cfg.yKeys.map((key, i) => ({
      label: key,
      data: rows.map(r => Number(r[key] ?? 0)),
      backgroundColor: cfg.colorMap?.[key] ?? defaultPalette[i % defaultPalette.length],
      borderWidth: 0,
      borderRadius: cfg.stacked ? 0 : 3,
    }));
  } else if (cfg.groupKey && cfg.yKey && cfg.groupKey !== cfg.xKey) {
    labels = Array.from(new Set(rows.map(r => String(r[cfg.xKey] ?? ''))));
    const uniqueGroups = Array.from(new Set(rows.map(r => String(r[cfg.groupKey!] ?? ''))));
    const dataMap = new Map<string, number>();
    rows.forEach(r => {
      dataMap.set(`${r[cfg.xKey]}|${r[cfg.groupKey!]}`, Number(r[cfg.yKey!] ?? 0));
    });
    datasets = uniqueGroups.map((grp, i) => ({
      label: grp,
      data: labels.map(lbl => dataMap.get(`${lbl}|${grp}`) ?? 0),
      backgroundColor: cfg.colorMap?.[grp] ?? defaultPalette[i % defaultPalette.length],
      borderWidth: 0,
      borderRadius: cfg.stacked ? 0 : 3,
    }));
  } else {
    labels = rows.map(r => String(r[cfg.xKey] ?? ''));
    const values = rows.map(r => Number(r[cfg.yKey ?? ''] ?? 0));
    const fallback = cfg.barColor ?? '#2B5E8E';
    const colors = rows.map(r => {
      const group = cfg.groupKey ? String(r[cfg.groupKey] ?? '') : String(r[cfg.xKey] ?? '');
      return cfg.colorMap?.[group] ?? fallback;
    });
    datasets = [{ label: cfg.datasetLabel ?? '', data: values, backgroundColor: colors, borderWidth: 0, borderRadius: 3 }];
  }

  const chart = new Chart(canvas, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      indexAxis: cfg.indexAxis ?? 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: cfg.showLegend ?? (datasets.length > 1) },
        title: { display: false },
        tooltip: { mode: 'index' as const, intersect: false },
      },
      scales: {
        x: {
          stacked: cfg.stacked ?? false,
          max: isHorizontal ? cfg.yMax : undefined,
          ticks: { font: { size: 10 } },
          title: cfg.xAxisLabel ? { display: true, text: cfg.xAxisLabel, font: { size: 11 } } : { display: false },
          grid: { display: !isHorizontal }
        },
        y: {
          stacked: cfg.stacked ?? false,
          max: !isHorizontal ? cfg.yMax : undefined,
          ticks: { font: { size: 10 } },
          title: cfg.yAxisLabel ? { display: true, text: cfg.yAxisLabel, font: { size: 11 } } : { display: false },
          grid: { display: isHorizontal }
        }
      }
    }
  });

  chartRegistry.set(canvasId, chart);
}

function initTabs(scopeId: string, btnClass: string, panelAttr: string, dataAttr: string, defaultKey?: string) {
  const scope = document.getElementById(scopeId);
  if (!scope) return;
  const btns = scope.querySelectorAll<HTMLButtonElement>(`.${btnClass}`);
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset[dataAttr];
      scope.querySelectorAll<HTMLElement>(`[${panelAttr}]`).forEach(p => {
        p.style.display = p.getAttribute(panelAttr) !== key ? 'none' : '';
      });
    });
  });
  const defaultBtn = defaultKey
    ? (Array.from(btns).find(b => b.dataset[dataAttr] === defaultKey) ?? btns[0])
    : btns[0];
  if (defaultBtn) defaultBtn.click();
}

async function initCharts() {
  await Promise.all([
    buildChart('chart-ccaa', {
      csvPath: 'csvs/o10/_page_8_Figure_4.csv',
      xKey: 'ccaa', yKeys: ['n_publicas', 'n_privadas'],
      indexAxis: 'y', yMax: 22,
      colorMap: { n_publicas: '#3397c5', n_privadas: '#f39a32' },
      showLegend: true,
    }),
    buildChart('chart-publicacion', {
      csvPath: 'csvs/o10/_page_9_Figure_2.csv',
      xKey: 'anio', yKeys: ['si', 'no'],
      colorMap: { si: '#3397c5', no: '#dde8f0' },
      yMax: 93, showLegend: true,
      yAxisLabel: 'Nº universidades',
    }),
    buildChart('chart-ods-nombra', {
      csvPath: 'csvs/o10/_page_13_Figure_5.csv',
      xKey: 'anio', yKeys: ['si', 'no'],
      colorMap: { si: '#3397c5', no: '#dde8f0' },
      yMax: 30, showLegend: true,
      yAxisLabel: 'Nº universidades con memoria',
    }),
    buildChart('chart-ods-2023', {
      csvPath: 'csvs/o10/_page_15_Figure_2.csv',
      xKey: 'ods', yKey: 'valor',
      groupKey: 'ods', colorMap: odsColorMap,
      yMax: 18, showLegend: false,
      indexAxis: 'y',
      datasetLabel: 'Nº universidades (2023)',
    }),
    buildChart('chart-ods-2016', {
      csvPath: 'csvs/o10/_page_16_Figure_3.csv',
      xKey: 'ods', yKey: 'valor',
      groupKey: 'ods', colorMap: odsColorMap,
      yMax: 5, showLegend: false,
      indexAxis: 'y',
      datasetLabel: 'Nº universidades (2016)',
    }),
    buildChart('chart-comp1', {
      csvPath: 'csvs/o10/_page_11_Figure_2.csv',
      xKey: 'anio', groupKey: 'serie', yKey: 'porcentaje',
      colorMap: {
        '% compromiso Agenda 2030': '#0070c0',
        '% compromiso explícito': '#d00000',
        '% carta compromiso': '#548235',
        '% ODS prioritarios': '#ff6600'
      },
      yMax: 100, showLegend: true, yAxisLabel: '%',
    }),
    buildChart('chart-comp2', {
      csvPath: 'csvs/o10/_page_12_Figure_3.csv',
      xKey: 'anio', groupKey: 'serie', yKey: 'porcentaje',
      colorMap: { '% medibles': '#5dade2', '% avances': '#ee6a5f' },
      yMax: 100, showLegend: true, yAxisLabel: '%',
    }),
    buildChart('chart-comp3', {
      csvPath: 'csvs/o10/_page_13_Figure_3.csv',
      xKey: 'anio', groupKey: 'serie', yKey: 'porcentaje',
      colorMap: { 'Alianzas': '#5dade2', 'Formación': '#ee6a5f', 'Buenas prácticas': '#58d68d' },
      yMax: 100, showLegend: true, yAxisLabel: '%',
    }),
    buildChart('chart-otros', {
      csvPath: 'csvs/o10/_page_16_Figure_5.csv',
      xKey: 'anio', yKeys: ['si', 'no'],
      colorMap: { si: '#3397c5', no: '#dde8f0' },
      yMax: 93, showLegend: true, yAxisLabel: 'Nº universidades',
    }),
  ]);
}

function init() {
  if (!document.getElementById('o10-dashboard')) return;
  initCharts();
  initTabs('o10-compromiso', 'comp-tab', 'data-tab-panel', 'tab');
  initTabs('o10-ods', 'ods-tab', 'data-ods-panel', 'ods', '2023');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
