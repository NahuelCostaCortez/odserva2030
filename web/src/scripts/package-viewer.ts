import { marked } from 'marked';
import {
  Chart,
  BarController,
  BubbleController,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import Papa from 'papaparse';

type Section = {
  id: string;
  content: string;
};

type Table = {
  id: string;
  sectionId: string;
  label?: string;
  headers: string[];
  rows: string[][];
};

type Figure = {
  id: string;
  sectionId: string;
  src: string;
  page: number | null;
  caption?: string;
};

type PackageData = {
  sections: Section[];
  tables: Table[];
  figures: Figure[];
};

type InteractiveFigureConfig = {
  chartType: 'bar' | 'bubble';
  csvPath: string;
  title: string;
  xKey: string;
  yKey: string;
  rKey?: string;
  labelKey?: string;
  groupKey?: string;
  yMax?: number;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  barColor?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  datasetLabel?: string;
  showLegend?: boolean;
  colorMap?: Record<string, string>;
};

type CsvRow = Record<string, string | number | null | undefined>;

const odsColorMap: Record<string, string> = {
  ODS1: '#e03e4c',
  ODS2: '#d3a029',
  ODS3: '#4c9f38',
  ODS4: '#c43c44',
  ODS5: '#ff6b4a',
  ODS6: '#2a9fd6',
  ODS7: '#fcc30b',
  ODS8: '#b04364',
  ODS9: '#ff8c4a',
  ODS10: '#e3337e',
  ODS11: '#f6a53a',
  ODS12: '#bf8b2e',
  ODS13: '#5c9a63',
  ODS14: '#0a97d9',
  ODS15: '#56c02b',
  ODS16: '#2f7ea8',
  ODS17: '#1b4f72'
};

const interactiveFigureConfigs: Record<string, InteractiveFigureConfig> = {
  'o1-figure-4': {
    chartType: 'bar',
    csvPath: 'csvs/o1/o1-figure-4.csv',
    title: 'Peso relativo de cada ODS en la LOSU',
    xKey: 'ODS',
    yKey: 'Porcentaje',
    groupKey: 'ODS',
    yMax: 33,
    xAxisLabel: 'ODS',
    yAxisLabel: 'Porcentaje',
    colorMap: odsColorMap
  },
  'o1-figure-5': {
    chartType: 'bubble',
    csvPath: 'csvs/o1/o1-figure-5.csv',
    title: 'Peso relativo de las metas especificas de cada ODS en la LOSU',
    xKey: 'X',
    yKey: 'Y',
    rKey: 'Size',
    labelKey: 'Meta',
    groupKey: 'ODS',
    xMin: 2.2,
    xMax: 9.2,
    yMin: 0.5,
    yMax: 9.3,
    showLegend: true,
    colorMap: odsColorMap
  },
  'o1-figure-7': {
    chartType: 'bar',
    csvPath: 'csvs/o1/o1-figure-7.csv',
    title: 'Cobertura media de los ODS entre universidades (ordenado)',
    xKey: 'ODS',
    yKey: 'Porcentaje',
    groupKey: 'ODS',
    yMax: 40,
    xAxisLabel: 'ODS',
    yAxisLabel: '% cobertura media',
    colorMap: odsColorMap
  },
  'o1-figure-10': {
    chartType: 'bar',
    csvPath: 'csvs/o1/o1-figure-10.csv',
    title: 'Los 10 targets específicos más frecuentes',
    xKey: 'Target',
    yKey: 'Frecuencia',
    groupKey: 'ODS',
    yMax: 80,
    xAxisLabel: 'Target especifico',
    yAxisLabel: 'Frecuencia',
    colorMap: odsColorMap
  },
  'o1-figure-16': {
    chartType: 'bar',
    csvPath: 'csvs/o1/o1-figure-16.csv',
    title: 'Top 10 Universidades - ODS 4',
    xKey: 'Universidad',
    yKey: 'Porcentaje',
    yMax: 100,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Porcentaje de cumplimiento',
    barColor: '#c43c44'
  }
};

marked.setOptions({ breaks: true });
Chart.register(
  BarController,
  BubbleController,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

function resolvePublicPath(relativeOrAbsolutePath: string): string {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const cleanPath = relativeOrAbsolutePath.replace(/^\/+/, '');
  return `${normalizedBase}${cleanPath}`;
}

function createTableHTML(table: Table): string {
  const block = document.createElement('div');
  block.className = 'table-block';
  
  if (table.label) {
    const label = document.createElement('p');
    label.className = 'table-label';
    label.textContent = table.label;
    block.appendChild(label);
  }
  
  const wrapper = document.createElement('div');
  wrapper.className = 'table-wrapper';
  
  const tableEl = document.createElement('table');
  
  if (table.headers.length) {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    table.headers.forEach((header) => {
      const th = document.createElement('th');
      th.innerHTML = header.replace(/\n/g, '<br/>');
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    tableEl.appendChild(thead);
  }
  
  const tbody = document.createElement('tbody');
  table.rows.forEach((row) => {
    const tr = document.createElement('tr');
    row.forEach((cell) => {
      const td = document.createElement('td');
      td.innerHTML = cell.replace(/\n/g, '<br/>');
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  tableEl.appendChild(tbody);
  
  wrapper.appendChild(tableEl);
  block.appendChild(wrapper);
  
  return block.outerHTML;
}

function createFigureHTML(figure: Figure): string {
  const interactiveConfig = interactiveFigureConfigs[figure.id];
  if (interactiveConfig) {
    return `<figure class="interactive-chart-figure" data-interactive-figure-id="${figure.id}"><div class="interactive-chart-wrapper"><p class="interactive-chart-status">Cargando gráfico interactivo...</p><canvas aria-label="${interactiveConfig.title}" role="img"></canvas></div></figure>`;
  }

  const fig = document.createElement('figure');
  
  const img = document.createElement('img');
  img.src = figure.src;
  img.alt = figure.caption || 'Figura del informe';
  img.loading = 'lazy';
  fig.appendChild(img);
  
  // No añadimos caption automático - las imágenes ya tienen su pie en el markdown original
  
  return fig.outerHTML;
}

function processContentPlaceholders(
  content: string,
  tablesById: Map<string, Table>,
  figuresById: Map<string, Figure>
): string {
  // Replace table placeholders
  let processed = content.replace(/\{\{TABLE:([^}]+)\}\}/g, (match, tableId) => {
    const table = tablesById.get(tableId);
    if (table) {
      return createTableHTML(table);
    }
    return '';
  });
  
  // Replace figure placeholders
  processed = processed.replace(/\{\{FIGURE:([^}]+)\}\}/g, (match, figureId) => {
    const figure = figuresById.get(figureId);
    if (figure) {
      return createFigureHTML(figure);
    }
    return '';
  });
  
  return processed;
}

async function buildInteractiveBarChart(
  figureEl: HTMLElement,
  config: InteractiveFigureConfig
): Promise<void> {
  const statusEl = figureEl.querySelector<HTMLElement>('.interactive-chart-status');
  const canvas = figureEl.querySelector<HTMLCanvasElement>('canvas');
  if (!canvas) {
    return;
  }

  try {
    const csvUrl = resolvePublicPath(config.csvPath);
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`No se pudo cargar ${csvUrl} (HTTP ${response.status})`);
    }

    const csvText = await response.text();
    const parsed = Papa.parse<CsvRow>(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    const dataRows = parsed.data.filter((row) => row && Object.keys(row).length > 0);
    const labels = dataRows.map((row) => String(row[config.xKey] ?? ''));
    const values = dataRows.map((row) => Number(row[config.yKey] ?? 0));
    const groups = dataRows.map((row) => String(row[config.groupKey ?? ''] ?? ''));
    const fallbackColor = config.barColor ?? '#7a7a7a';
    const barColors = dataRows.map((_, index) => {
      const group = groups[index];
      if (config.groupKey && config.colorMap?.[group]) {
        return config.colorMap[group];
      }
      return fallbackColor;
    });

    if (!labels.length) {
      throw new Error('CSV sin filas válidas');
    }

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: config.yKey,
            data: values,
            backgroundColor: barColors,
            borderWidth: 0,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: Boolean(config.showLegend) },
          title: {
            display: true,
            text: config.title,
            font: { size: 18, weight: 'bold' },
            padding: { bottom: 20 }
          },
          tooltip: {
            callbacks: {
              afterLabel: (context) => {
                const group = groups[context.dataIndex];
                return group ? `ODS: ${group}` : '';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            min: config.yMin,
            max: config.yMax,
            title: {
              display: true,
              text: config.yAxisLabel ?? config.yKey,
              font: { weight: 'bold' }
            },
            grid: { color: '#f0f0f0' }
          },
          x: {
            title: {
              display: true,
              text: config.xAxisLabel ?? config.xKey,
              font: { weight: 'bold' }
            },
            grid: { display: false }
          }
        }
      }
    });

    if (statusEl) {
      statusEl.remove();
    }
  } catch (error) {
    console.error(error);
    if (statusEl) {
      statusEl.textContent = 'No se pudo cargar el gráfico interactivo.';
    }
  }
}

async function buildInteractiveBubbleChart(
  figureEl: HTMLElement,
  config: InteractiveFigureConfig
): Promise<void> {
  const statusEl = figureEl.querySelector<HTMLElement>('.interactive-chart-status');
  const canvas = figureEl.querySelector<HTMLCanvasElement>('canvas');
  if (!canvas || !config.rKey) {
    return;
  }

  try {
    const csvUrl = resolvePublicPath(config.csvPath);
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`No se pudo cargar ${csvUrl} (HTTP ${response.status})`);
    }

    const csvText = await response.text();
    const parsed = Papa.parse<CsvRow>(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    const dataRows = parsed.data.filter((row) => row && Object.keys(row).length > 0);
    if (!dataRows.length) {
      throw new Error('CSV sin filas válidas');
    }

    const datasetsByGroup = new Map<
      string,
      { label: string; data: Array<{ x: number; y: number; r: number; metaLabel: string }>; backgroundColor: string }
    >();

    dataRows.forEach((row) => {
      const group = String(row[config.groupKey ?? ''] ?? 'Serie');
      const x = Number(row[config.xKey] ?? 0);
      const y = Number(row[config.yKey] ?? 0);
      const r = Number(row[config.rKey ?? ''] ?? 0);
      const metaLabel = String(row[config.labelKey ?? ''] ?? '');

      if (!datasetsByGroup.has(group)) {
        datasetsByGroup.set(group, {
          label: group,
          data: [],
          backgroundColor: config.colorMap?.[group] ?? '#7a7a7a'
        });
      }

      datasetsByGroup.get(group)?.data.push({ x, y, r, metaLabel });
    });

    new Chart(canvas, {
      type: 'bubble',
      data: {
        datasets: Array.from(datasetsByGroup.values())
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: config.showLegend ?? true, position: 'bottom' },
          title: {
            display: true,
            text: config.title,
            font: { size: 18, weight: 'bold' },
            padding: { bottom: 20 }
          },
          tooltip: {
            callbacks: {
              title: (contexts) => {
                const raw = contexts[0]?.raw as { metaLabel?: string } | undefined;
                return raw?.metaLabel || '';
              },
              label: (context) => {
                const raw = context.raw as { r: number } | undefined;
                return `${context.dataset.label} - tamano relativo: ${raw?.r ?? 0}`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            min: config.xMin,
            max: config.xMax,
            grid: { display: false },
            ticks: { display: false }
          },
          y: {
            type: 'linear',
            min: config.yMin,
            max: config.yMax,
            grid: { display: false },
            ticks: { display: false }
          }
        }
      }
    });

    if (statusEl) {
      statusEl.remove();
    }
  } catch (error) {
    console.error(error);
    if (statusEl) {
      statusEl.textContent = 'No se pudo cargar el gráfico interactivo.';
    }
  }
}

async function renderInteractiveFigures(container: Element): Promise<void> {
  const figures = Array.from(
    container.querySelectorAll<HTMLElement>('[data-interactive-figure-id]')
  );
  await Promise.all(
    figures.map(async (figureEl) => {
      const figureId = figureEl.dataset.interactiveFigureId;
      if (!figureId) return;
      const config = interactiveFigureConfigs[figureId];
      if (!config) return;
      if (config.chartType === 'bubble') {
        await buildInteractiveBubbleChart(figureEl, config);
        return;
      }
      await buildInteractiveBarChart(figureEl, config);
    })
  );
}

export default async function initPackageViewer(container: Element | null, dataPath?: string) {
  if (!container || !dataPath) return;
  
  const loading = document.createElement('p');
  loading.textContent = 'Cargando contenido...';
  container.prepend(loading);
  
  try {
    const response = await fetch(dataPath);
    if (!response.ok) {
      throw new Error(`No se pudo cargar ${dataPath}`);
    }
    const data = (await response.json()) as PackageData;
    loading.remove();
    
    // Create lookup maps
    const tablesById = new Map<string, Table>();
    data.tables.forEach((table) => tablesById.set(table.id, table));
    
    const figuresById = new Map<string, Figure>();
    data.figures.forEach((figure) => figuresById.set(figure.id, figure));
    
    // Process each section
    const sectionBlocks = container.querySelectorAll<HTMLElement>('[data-section-block]');
    sectionBlocks.forEach((block) => {
      const sectionId = block.dataset.sectionBlock;
      if (!sectionId) return;
      
      const sectionData = data.sections.find((section) => section.id === sectionId);
      const contentEl = block.querySelector<HTMLElement>('[data-section-content]');
      
      if (contentEl && sectionData?.content) {
        // Process placeholders and convert markdown
        const processedContent = processContentPlaceholders(
          sectionData.content,
          tablesById,
          figuresById
        );
        // Convert remaining markdown to HTML
        contentEl.innerHTML = marked.parse(processedContent) as string;
      }
      
      // Clear the separate tables and figures containers since they're now inline
      const tablesEl = block.querySelector<HTMLElement>('[data-section-tables]');
      if (tablesEl) tablesEl.innerHTML = '';
      
      const figuresEl = block.querySelector<HTMLElement>('[data-section-figures]');
      if (figuresEl) figuresEl.innerHTML = '';
    });
    await renderInteractiveFigures(container);
  } catch (error) {
    console.error(error);
    loading.textContent = 'No se pudo cargar el contenido. Revisa el archivo de datos.';
  }
}

const container = document.querySelector<HTMLElement>('#package-sections');
const dataPath = container?.dataset.packagePath || container?.dataset.dataPath;
if (container && dataPath) {
  initPackageViewer(container, dataPath);
}
