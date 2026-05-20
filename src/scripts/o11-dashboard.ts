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
  labelMap?: Record<string, string>;
  showLegend?: boolean;
  indexAxis?: 'x' | 'y';
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
  const defaultPalette = ['#3397c5', '#f39a32', '#bfbfbf', '#5dade2', '#ee6a5f'];

  let labels: string[];
  let datasets: any[];

  if (cfg.yKeys && cfg.yKeys.length > 0) {
    labels = rows.map(r => String(r[cfg.xKey] ?? ''));
    datasets = cfg.yKeys.map((key, i) => ({
      label: cfg.labelMap?.[key] ?? key,
      data: rows.map(r => Number(r[key] ?? 0)),
      backgroundColor: cfg.colorMap?.[key] ?? defaultPalette[i % defaultPalette.length],
      borderWidth: 0,
      borderRadius: 3,
    }));
  } else if (cfg.groupKey && cfg.yKey && cfg.groupKey !== cfg.xKey) {
    labels = Array.from(new Set(rows.map(r => String(r[cfg.xKey] ?? ''))));
    const uniqueGroups = Array.from(new Set(rows.map(r => String(r[cfg.groupKey!] ?? ''))));
    const dataMap = new Map<string, number>();
    rows.forEach(r => {
      dataMap.set(`${r[cfg.xKey]}|${r[cfg.groupKey!]}`, Number(r[cfg.yKey!] ?? 0));
    });
    datasets = uniqueGroups.map((grp, i) => ({
      label: cfg.labelMap?.[grp] ?? grp,
      data: labels.map(lbl => dataMap.get(`${lbl}|${grp}`) ?? 0),
      backgroundColor: cfg.colorMap?.[grp] ?? defaultPalette[i % defaultPalette.length],
      borderWidth: 0,
      borderRadius: 3,
    }));
  } else {
    labels = rows.map(r => String(r[cfg.xKey] ?? ''));
    const values = rows.map(r => Number(r[cfg.yKey ?? ''] ?? 0));
    const fallback = cfg.barColor ?? '#3397c5';
    const colors = rows.map(r => {
      const group = cfg.groupKey ? String(r[cfg.groupKey] ?? '') : String(r[cfg.xKey] ?? '');
      return cfg.colorMap?.[group] ?? fallback;
    });
    datasets = [{ label: cfg.datasetLabel ?? '', data: values, backgroundColor: colors, borderWidth: 0, borderRadius: 4 }];
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
          max: isHorizontal ? cfg.yMax : undefined,
          ticks: { font: { size: 10 } },
          title: cfg.xAxisLabel ? { display: true, text: cfg.xAxisLabel, font: { size: 11 } } : { display: false },
          grid: { display: !isHorizontal },
        },
        y: {
          max: !isHorizontal ? cfg.yMax : undefined,
          ticks: { font: { size: 10 } },
          title: cfg.yAxisLabel ? { display: true, text: cfg.yAxisLabel, font: { size: 11 } } : { display: false },
          grid: { display: isHorizontal },
        }
      }
    }
  });

  chartRegistry.set(canvasId, chart);
}

async function initCharts() {
  await Promise.all([
    // Públicas vs privadas: total y que publican
    buildChart('chart-pub-priv', {
      csvPath: 'csvs/o11/_page_6_Figure_2.csv',
      xKey: 'tipo_universidad', groupKey: 'serie', yKey: 'valor',
      yMax: 55, showLegend: true,
      colorMap: { T: '#bfbfbf', C: '#3397c5' },
      labelMap: { T: 'Total', C: 'Con info en web' },
      yAxisLabel: 'Nº universidades',
    }),
    // Tamaño vs publicación
    buildChart('chart-tamano', {
      csvPath: 'csvs/o11/_page_6_Figure_4.csv',
      xKey: 'rango', yKeys: ['publica', 'privada'],
      yMax: 30, showLegend: true,
      colorMap: { publica: '#3397c5', privada: '#f39a32' },
      labelMap: { publica: 'Pública', privada: 'Privada' },
      yAxisLabel: 'Nº universidades',
    }),
    // Nº idiomas (1 / 2 / >2)
    buildChart('chart-nidiomas', {
      csvPath: 'csvs/o11/_page_8_Figure_3.csv',
      xKey: 'categoria', yKey: 'valor',
      groupKey: 'categoria',
      colorMap: { '1 idioma': '#9cc2e5', '2 idiomas': '#3397c5', '> 2 idiomas': '#2B5E8E' },
      showLegend: false, yMax: 50,
      yAxisLabel: 'Nº universidades',
    }),
    // Idiomas de publicación
    buildChart('chart-idiomas', {
      csvPath: 'csvs/o11/_page_8_Figure_5.csv',
      xKey: 'idioma', yKey: 'valor',
      barColor: '#3397c5',
      showLegend: false, yMax: 100,
      yAxisLabel: 'Nº universidades',
    }),
    // Lenguaje accesible e inclusivo
    buildChart('chart-accesible', {
      csvPath: 'csvs/o11/_page_10_Figure_3.csv',
      xKey: 'categoria', yKey: 'valor',
      colorMap: { 'Lenguaje accesible': '#3397c5', 'Lenguaje inclusivo': '#dde8f0' },
      groupKey: 'categoria',
      showLegend: false, yMax: 8,
      yAxisLabel: 'Nº universidades',
    }),
    // Memorias enlazadas en web 2025
    buildChart('chart-memorias-web', {
      csvPath: 'csvs/o11/_page_10_Figure_5.csv',
      xKey: 'respuesta', yKey: 'valor',
      colorMap: { 'Sí': '#3397c5', 'No': '#dde8f0' },
      groupKey: 'respuesta',
      showLegend: false, yMax: 70,
      yAxisLabel: 'Nº universidades',
    }),
  ]);
}

function init() {
  if (!document.getElementById('o11-dashboard')) return;
  initCharts();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
