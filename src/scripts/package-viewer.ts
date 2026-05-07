import { marked } from 'marked';
import {
  Chart,
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'hammerjs';
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
  chartType: 'bar' | 'line';
  csvPath: string;
  title: string;
  xKey: string;
  yKey?: string;
  yKeys?: string[];
  stacked?: boolean;
  indexAxis?: 'x' | 'y'; // 'x' barras verticales (defecto), 'y' barras horizontales
  pivotMode?: boolean; // filas del CSV → datasets, columnas (exc. xKey) → labels del eje categoría
  groupKey?: string;
  yMax?: number;
  xMax?: number;
  barColor?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  datasetLabel?: string;
  showLegend?: boolean;
  colorMap?: Record<string, string>;
  zoomable?: boolean;
};

type CsvRow = Record<string, string | number | null | undefined>;

const odsColorMap: Record<string, string> = {
  'AGENDA 2030': '#6EC1E4',
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

// Estilos fijos por nombre de serie para gráficos de líneas
const lineSeriesStyles: Record<string, { color: string; dash: number[] }> = {
  'Universidad Publica': { color: '#6EC1E4', dash: [6, 3] },
  'Universidad Privada': { color: '#4472C4', dash: [6, 3] },
  'Total':               { color: '#2E4A7A', dash: [] }
};

const getResponsiveFontSize = (context: any) => ({
  size: (context.scale.max - context.scale.min) > 40 ? 9 : 12
});

const interactiveFigureConfigs: Record<string, InteractiveFigureConfig> = {
  // --- Peso relativo de cada ODS en la LOSU ---
  '_page_22_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_22_Figure_2.csv',
    title: 'Peso relativo de cada ODS en la LOSU',
    xKey: 'ODS',
    yKey: 'Porcentaje',
    groupKey: 'ODS',
    yMax: 35,
    xAxisLabel: 'ODS',
    yAxisLabel: 'Porcentaje',
    colorMap: odsColorMap
  },
  // --- Grado de implicación de las universidades con los ODS ---
  '_page_28_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_28_Figure_2.csv',
    title: 'Grado de implicación de las universidades con los ODS',
    xKey: 'Universidad',
    groupKey: 'ODS',
    yKey: 'Presencia',
    indexAxis: 'y',
    stacked: true,
    xAxisLabel: 'Número de ODS',
    yAxisLabel: 'Universidad',
    yMax: 17,
    showLegend: true,
    colorMap: odsColorMap
  },
  // --- Peso relativo medio de cada ODS en los estatutos ---
  '_page_29_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_29_Figure_2.csv',
    title: 'Peso relativo medio de cada ODS en los estatutos',
    xKey: 'ODS',
    yKey: 'Cobertura media (%)',
    groupKey: 'ODS',
    yMax: 40,
    xAxisLabel: 'ODS',
    yAxisLabel: 'Cobertura media (%)',
    colorMap: odsColorMap
  },
  // --- Frecuencia de targets especificos agrupados por ODS ---
  '_page_30_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_30_Figure_2.csv',
    title: 'Frecuencia de targets específicos agrupados por ODS',
    xKey: 'Target especifico',
    yKey: 'Valores',
    groupKey: 'ODS',
    yMax: 80,
    xAxisLabel: 'Target específico',
    yAxisLabel: 'Valores',
    colorMap: odsColorMap
  },
  // --- Frecuencia de targets especificos agrupados por ODS ordenados ---
  '_page_31_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_31_Figure_2.csv',
    title: 'Frecuencia de targets específicos agrupados por ODS ordenados',
    xKey: 'Target especifico',
    yKey: 'Frecuencia',
    groupKey: 'ODS',
    yMax: 80,
    xAxisLabel: 'Target específico',
    yAxisLabel: 'Frecuencia',
    colorMap: odsColorMap
  },
  // --- Las 10 metas especificas mas abordadas ---
  '_page_32_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_32_Figure_2.csv',
    title: 'Las 10 metas específicas más abordadas en los estatutos',
    xKey: 'Target especifico',
    yKey: 'Frecuencia',
    groupKey: 'ODS',
    yMax: 80,
    xAxisLabel: 'Target específico',
    yAxisLabel: 'Frecuencia',
    colorMap: odsColorMap
  },
  // --- Cobertura relativa por ODS en los estatutos universitarios ---
  '_page_33_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_33_Figure_2.csv',
    title: 'Menciones por ODS en los estatutos universitarios',
    xKey: 'Universidad',
    yKeys: ['ODS1', 'ODS2', 'ODS3', 'ODS4', 'ODS5', 'ODS6', 'ODS7', 'ODS8', 'ODS9', 'ODS10', 'ODS11', 'ODS12', 'ODS13', 'ODS14', 'ODS15', 'ODS16', 'ODS17'],
    yMax: 70,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Cobertura (%)',
    showLegend: true,
    colorMap: odsColorMap
  },
  // --- Cobertura relativa por ODS en los estatutos universitarios (%) ---
  '_page_35_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_35_Figure_2.csv',
    title: 'Cobertura relativa por ODS en los estatutos universitarios (%)',
    xKey: 'Universidad',
    yKeys: ['ODS1', 'ODS2', 'ODS3', 'ODS4', 'ODS5', 'ODS6', 'ODS7', 'ODS8', 'ODS9', 'ODS10', 'ODS11', 'ODS12', 'ODS13', 'ODS14', 'ODS15', 'ODS16', 'ODS17'],
    yMax: 100,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Cobertura (%)',
    showLegend: true,
    colorMap: odsColorMap
  },
  // === Figura 11: Top 10 universidades por % relativo (páginas 36-44) ===
  '_page_36_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_36_Figure_2.csv',
    title: 'Top 10 Universidades - ODS 1',
    xKey: 'Universidad',
    yKey: 'Porcentaje de cumplimiento',
    yMax: 55,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Porcentaje de cumplimiento',
    barColor: '#e03e4c'
  },
  '_page_37_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_37_Figure_2.csv',
    title: 'Top 10 Universidades - ODS 2',
    xKey: 'Universidad',
    yKey: 'Porcentaje de cumplimiento',
    yMax: 5,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Porcentaje de cumplimiento',
    barColor: '#d3a029'
  },
  '_page_37_Figure_3': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_37_Figure_3.csv',
    title: 'Top 10 Universidades - ODS 3',
    xKey: 'Universidad',
    yKey: 'Porcentaje de cumplimiento',
    yMax: 25,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Porcentaje de cumplimiento',
    barColor: '#4c9f38'
  },
  '_page_38_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_38_Figure_2.csv',
    title: 'Top 10 Universidades - ODS 4',
    xKey: 'Universidad',
    yKey: 'Porcentaje de cumplimiento',
    yMax: 105,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Porcentaje de cumplimiento',
    barColor: '#c43c44'
  },
  '_page_38_Figure_3': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_38_Figure_3.csv',
    title: 'Top 10 Universidades - ODS 5',
    xKey: 'Universidad',
    yKey: 'Porcentaje de cumplimiento',
    yMax: 60,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Porcentaje de cumplimiento',
    barColor: '#ff6b4a'
  },
  '_page_39_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_39_Figure_2.csv',
    title: 'Top 10 Universidades - ODS 6',
    xKey: 'Universidad',
    yKey: 'Porcentaje de cumplimiento',
    yMax: 4,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Porcentaje de cumplimiento',
    barColor: '#2a9fd6'
  },
  '_page_39_Figure_3': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_39_Figure_3.csv',
    title: 'Top 10 Universidades - ODS 7',
    xKey: 'Universidad',
    yKey: 'Porcentaje de cumplimiento',
    yMax: 5,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Porcentaje de cumplimiento',
    barColor: '#fcc30b'
  },
  '_page_40_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_40_Figure_2.csv',
    title: 'Top 10 Universidades - ODS 8',
    xKey: 'Universidad',
    yKey: 'Porcentaje de cumplimiento',
    yMax: 40,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Porcentaje de cumplimiento',
    barColor: '#b04364'
  },
  '_page_40_Figure_3': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_40_Figure_3.csv',
    title: 'Top 10 Universidades - ODS 9',
    xKey: 'Universidad',
    yKey: 'Porcentaje de cumplimiento',
    yMax: 55,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Porcentaje de cumplimiento',
    barColor: '#ff8c4a'
  },
  '_page_41_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_41_Figure_2.csv',
    title: 'Top 10 Universidades - ODS 10',
    xKey: 'Universidad',
    yKey: 'Porcentaje de cumplimiento',
    yMax: 85,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Porcentaje de cumplimiento',
    barColor: '#e3337e'
  },
  '_page_41_Figure_3': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_41_Figure_3.csv',
    title: 'Top 10 Universidades - ODS 11',
    xKey: 'Universidad',
    yKey: 'Porcentaje de cumplimiento',
    yMax: 12,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Porcentaje de cumplimiento',
    barColor: '#f6a53a'
  },
  '_page_42_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_42_Figure_2.csv',
    title: 'Top 10 Universidades - ODS 12',
    xKey: 'Universidad',
    yKey: 'Porcentaje de cumplimiento',
    yMax: 20,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Porcentaje de cumplimiento',
    barColor: '#bf8b2e'
  },
  '_page_42_Figure_3': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_42_Figure_3.csv',
    title: 'Top 10 Universidades - ODS 13',
    xKey: 'Universidad',
    yKey: 'Porcentaje de cumplimiento',
    yMax: 10,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Porcentaje de cumplimiento',
    barColor: '#5c9a63'
  },
  '_page_43_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_43_Figure_2.csv',
    title: 'Top 10 Universidades - ODS 14',
    xKey: 'Universidad',
    yKey: 'Porcentaje de cumplimiento',
    yMax: 5,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Porcentaje de cumplimiento',
    barColor: '#0a97d9'
  },
  '_page_43_Figure_3': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_43_Figure_3.csv',
    title: 'Top 10 Universidades - ODS 15',
    xKey: 'Universidad',
    yKey: 'Porcentaje de cumplimiento',
    yMax: 35,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Porcentaje de cumplimiento',
    barColor: '#56c02b'
  },
  '_page_44_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_44_Figure_2.csv',
    title: 'Top 10 Universidades - ODS 16',
    xKey: 'Universidad',
    yKey: 'Porcentaje de cumplimiento',
    yMax: 55,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Porcentaje de cumplimiento',
    barColor: '#2f7ea8'
  },
  '_page_44_Figure_3': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_44_Figure_3.csv',
    title: 'Top 10 Universidades - ODS 17',
    xKey: 'Universidad',
    yKey: 'Porcentaje de cumplimiento',
    yMax: 20,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Porcentaje de cumplimiento',
    barColor: '#1b4f72'
  },
  // === Figura 12: Top 10 universidades por numero de menciones (páginas 47-55) ===
  '_page_47_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_47_Figure_2.csv',
    title: 'Top 10 Universidades por menciones - ODS 1',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 40,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#e03e4c'
  },
  '_page_47_Figure_3': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_47_Figure_3.csv',
    title: 'Top 10 Universidades por menciones - ODS 2',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 25,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#d3a029'
  },
  '_page_48_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_48_Figure_2.csv',
    title: 'Top 10 Universidades por menciones - ODS 3',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 20,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#4c9f38'
  },
  '_page_48_Figure_3': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_48_Figure_3.csv',
    title: 'Top 10 Universidades por menciones - ODS 4',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 22,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#c43c44'
  },
  '_page_49_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_49_Figure_2.csv',
    title: 'Top 10 Universidades por menciones - ODS 5',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 15,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#ff6b4a'
  },
  '_page_49_Figure_3': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_49_Figure_3.csv',
    title: 'Top 10 Universidades por menciones - ODS 6',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 12,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#2a9fd6'
  },
  '_page_50_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_50_Figure_2.csv',
    title: 'Top 10 Universidades por menciones - ODS 7',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 8,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#fcc30b'
  },
  '_page_50_Figure_3': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_50_Figure_3.csv',
    title: 'Top 10 Universidades por menciones - ODS 8',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 12,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#b04364'
  },
  '_page_51_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_51_Figure_2.csv',
    title: 'Top 10 Universidades por menciones - ODS 9',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 16,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#ff8c4a'
  },
  '_page_51_Figure_3': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_51_Figure_3.csv',
    title: 'Top 10 Universidades por menciones - ODS 10',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 24,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#e3337e'
  },
  '_page_52_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_52_Figure_2.csv',
    title: 'Top 10 Universidades por menciones - ODS 11',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 5,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#f6a53a'
  },
  '_page_52_Figure_3': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_52_Figure_3.csv',
    title: 'Top 10 Universidades por menciones - ODS 12',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 4,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#bf8b2e'
  },
  '_page_53_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_53_Figure_2.csv',
    title: 'Top 10 Universidades por menciones - ODS 13',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 3,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#5c9a63'
  },
  '_page_53_Figure_3': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_53_Figure_3.csv',
    title: 'Top 10 Universidades por menciones - ODS 14',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 2,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#0a97d9'
  },
  '_page_54_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_54_Figure_2.csv',
    title: 'Top 10 Universidades por menciones - ODS 15',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 2,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#56c02b'
  },
  '_page_54_Figure_3': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_54_Figure_3.csv',
    title: 'Top 10 Universidades por menciones - ODS 16',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 4,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#2f7ea8'
  },
  '_page_55_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_55_Figure_2.csv',
    title: 'Top 10 Universidades por menciones - ODS 17',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 4,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#1b4f72'
  },
  // === Universidades con más/menos menciones de ODS ===
  '_page_56_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_56_Figure_2.csv',
    title: 'Universidades con mayor mención de ODS',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 140,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#6EC1E4',
    datasetLabel: 'Número de palabras',
    showLegend: true
  },
  '_page_57_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_57_Figure_2.csv',
    title: 'Universidades con menor mención de ODS',
    xKey: 'Universidad',
    yKey: 'Numero de palabras',
    yMax: 10,
    xAxisLabel: 'Universidad',
    yAxisLabel: 'Número de palabras',
    barColor: '#6EC1E4',
    datasetLabel: 'Número de palabras',
    showLegend: true
  },
  // === Gráficos temporales (líneas) ===
  '_page_74_Figure_2': {
    chartType: 'line',
    csvPath: 'csvs/o1/_page_74_Figure_2.csv',
    title: 'Porcentaje de universidades con mujer rectora',
    xKey: 'Año',
    yKeys: ['Universidad Publica', 'Universidad Privada', 'Total'],
    yMax: 40,
    xAxisLabel: 'Año',
    yAxisLabel: 'Porcentaje de universidades con mujer rectora',
    showLegend: true
  },
  '_page_75_Figure_4': {
    chartType: 'line',
    csvPath: 'csvs/o1/_page_75_Figure_4.csv',
    title: 'Porcentaje de universidades con mujer gerente',
    xKey: 'Año',
    yKeys: ['Universidad Publica', 'Universidad Privada', 'Total'],
    yMax: 50,
    xAxisLabel: 'Año',
    yAxisLabel: 'Porcentaje de universidades con mujer gerente',
    showLegend: true
  },
  '_page_77_Figure_2': {
    chartType: 'line',
    csvPath: 'csvs/o1/_page_77_Figure_2.csv',
    title: 'Porcentaje de mujeres en el Consejo Rectoral',
    xKey: 'Año',
    yKeys: ['Universidad Publica', 'Universidad Privada', 'Total'],
    yMax: 60,
    xAxisLabel: 'Año',
    yAxisLabel: 'Porcentaje de mujeres en el Consejo Rectoral',
    showLegend: true
  },
  '_page_78_Figure_2': {
    chartType: 'line',
    csvPath: 'csvs/o1/_page_78_Figure_2.csv',
    title: 'Universidades con un porcentaje de mujeres entre el 40 y 60 % en el consejo rectoral',
    xKey: 'Año',
    yKeys: ['Universidad Publica', 'Universidad Privada', 'Total'],
    yMax: 85,
    xAxisLabel: 'Año',
    yAxisLabel: 'Porcentaje universidades',
    showLegend: true
  },
  '_page_80_Figure_2': {
    chartType: 'line',
    csvPath: 'csvs/o1/_page_80_Figure_2.csv',
    title: 'Promedio de miembros en el Consejo Rectoral',
    xKey: 'Año',
    yKeys: ['Universidad Publica', 'Universidad Privada', 'Total'],
    yMax: 15,
    xAxisLabel: 'Año',
    yAxisLabel: 'Promedio miembros en el Consejo Rectoral',
    showLegend: true
  },
  '_page_80_Figure_4': {
    chartType: 'line',
    csvPath: 'csvs/o1/_page_80_Figure_4.csv',
    title: 'Miembros en el Consejo Rectoral por cada 1000 alumnos',
    xKey: 'Año',
    yKeys: ['Universidad Publica', 'Universidad Privada'],
    yMax: 0.7,
    xAxisLabel: 'Año',
    yAxisLabel: 'Número de miembros en el Consejo Rectoral por cada 1000 alumnos',
    showLegend: true
  },
  '_page_83_Figure_2': {
    chartType: 'line',
    csvPath: 'csvs/o1/_page_83_Figure_2.csv',
    title: 'Porcentaje de universidades con vicerrectorado en sostenibilidad',
    xKey: 'Año',
    yKeys: ['Universidad Publica', 'Universidad Privada', 'Total'],
    yMax: 100,
    xAxisLabel: 'Año',
    yAxisLabel: 'Porcentaje de universidades con vicerrectorado en sostenibilidad',
    showLegend: true
  },
  '_page_83_Figure_4': {
    chartType: 'line',
    csvPath: 'csvs/o1/_page_83_Figure_4.csv',
    title: 'Vicerrectorado de sostenibilidad por tamaño de universidad',
    xKey: 'Alumnos Matriculados',
    yKeys: ['Universidad Publica', 'Universidad Privada'],
    yMax: 100,
    xAxisLabel: 'Alumnos Matriculados',
    yAxisLabel: 'Porcentaje de universidades con vicerrectorado en sostenibilidad',
    showLegend: true
  },
  '_page_86_Figure_2': {
    chartType: 'line',
    csvPath: 'csvs/o1/_page_86_Figure_2.csv',
    title: 'Porcentaje de universidades con director de área en sostenibilidad',
    xKey: 'Año',
    yKeys: ['Universidad Publica', 'Universidad Privada', 'Total'],
    yMax: 75,
    xAxisLabel: 'Año',
    yAxisLabel: 'Porcentaje de universidades con director de área en sostenibilidad',
    showLegend: true
  },
  '_page_86_Figure_4': {
    chartType: 'line',
    csvPath: 'csvs/o1/_page_86_Figure_4.csv',
    title: 'Porcentaje de universidades con comisión de sostenibilidad',
    xKey: 'Año',
    yKeys: ['Universidad Publica', 'Universidad Privada', 'Total'],
    yMax: 35,
    xAxisLabel: 'Año',
    yAxisLabel: 'Porcentaje de universidades con comisión de sostenibilidad',
    showLegend: true
  },
  // === Gráficos de barras verticales con 3 categorías ===
  '_page_74_Figure_4': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_74_Figure_4.csv',
    title: 'Tipo de universidad y presencia femenina en rectorado',
    xKey: 'Tipo',
    yKey: 'Porcentaje de universidades',
    yMax: 75,
    xAxisLabel: '',
    yAxisLabel: 'Porcentaje de universidades',
    groupKey: 'Tipo',
    colorMap: { 'Publica': '#6EC1E4', 'Privada': '#5B8FD6', 'Total': '#3A3F9E' }
  },
  // === Histograma / distribución ===
  '_page_77_Figure_4': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_77_Figure_4.csv',
    title: 'Universidades según el porcentaje de mujeres en sus consejos rectorales en 2025',
    xKey: 'Rango de mujeres en Consejo Rectoral',
    yKey: 'Porcentaje de universidades',
    yMax: 50,
    xAxisLabel: 'Porcentaje de mujeres en el Consejo Rectoral',
    yAxisLabel: 'Porcentaje de universidades',
    barColor: '#6EC1E4',
    datasetLabel: 'Porcentaje de universidades',
    showLegend: true
  },
  // === Barras horizontales por CCAA ===
  '_page_75_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_75_Figure_2.csv',
    title: 'Universidades que nunca han tenido una mujer como rectora',
    xKey: 'CCAA',
    yKey: 'Porcentaje de universidades',
    yMax: 100,
    indexAxis: 'y',
    xAxisLabel: 'Porcentaje de universidades',
    yAxisLabel: 'CCAA',
    barColor: '#6EC1E4'
  },
  '_page_78_Figure_4': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_78_Figure_4.csv',
    title: 'Representación femenina en Consejo Rectoral por CCAA',
    xKey: 'CCAA',
    yKey: 'Porcentaje de mujeres en Consejo Rectoral',
    yMax: 75,
    indexAxis: 'y',
    xAxisLabel: 'Porcentaje de mujeres en Consejo Rectoral',
    yAxisLabel: 'CCAA',
    barColor: '#6EC1E4'
  },
  '_page_81_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_81_Figure_2.csv',
    title: 'Miembros en Consejo Rectoral por cada 1000 alumnos, por CCAA',
    xKey: 'CCAA',
    yKey: 'Miembros en Consejo Rectoral por cada 1000 alumnos',
    yMax: 1.2,
    indexAxis: 'y',
    xAxisLabel: 'Miembros / 1000 alumnos',
    yAxisLabel: 'CCAA',
    barColor: '#6EC1E4'
  },
  // === Barras horizontales por ODS (multicolor) ===
  '_page_84_Figure_2': {
    chartType: 'bar',
    csvPath: 'csvs/o1/_page_84_Figure_2.csv',
    title: 'Porcentaje de vicerrectorados que mencionan cada ODS',
    xKey: 'ODS',
    yKey: 'Porcentaje de vicerrectorados',
    yMax: 80,
    indexAxis: 'y',
    groupKey: 'ODS',
    xAxisLabel: 'Porcentaje de vicerrectorados',
    yAxisLabel: 'Objetivos de Desarrollo Sostenible',
    colorMap: odsColorMap
  }
};

marked.setOptions({ breaks: true });
Chart.register(
  BarController,
  LineController,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

Chart.defaults.font.family = "'Roboto Slab', serif";
Chart.defaults.color = '#000000';

function getCommonChartOptions(config: InteractiveFigureConfig) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: config.showLegend ?? (config.yKeys ? true : false),
        position: 'bottom' as const
      },
      title: {
        display: true,
        text: config.title,
        font: { size: 18, weight: 'bold' as const },
        padding: { bottom: 20 }
      },
      tooltip: {
        enabled: true,
        callbacks: {}
      },
      zoom: {
        limits: {
          y: { min: 0, max: (config.yMax || 100) * 1.1 }, // No bajar de 0 y dar un 10% de margen arriba
        },
        pan: {
          enabled: config.zoomable !== false,
          mode: 'xy' as const,
          threshold: 10
        },
        zoom: {
          wheel: {
            enabled: config.zoomable !== false
          },
          pinch: {
            enabled: config.zoomable !== false
          },
          mode: 'xy' as const,
          // Evitar que el zoom se vuelva loco (mínimo 0.5x, máximo 10x de la vista original)
          rangeMin: { x: 0, y: 0 },
          rangeMax: { y: config.yMax }
        }
      }
    }
  };
}

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
  const wrapper = figureEl.querySelector<HTMLElement>('.interactive-chart-wrapper');

  if (!canvas || !wrapper) {
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

    const isHorizontal = config.indexAxis === 'y';

    // Construir labels y datasets según el modo de lectura del CSV
    let labels: string[];
    let datasets: any[];

    if (config.pivotMode) {
      // Cada fila del CSV = un dataset (p.ej. un ODS)
      // Las columnas (excepto xKey) = labels del eje de categorías (universidades)
      labels = Object.keys(dataRows[0]).filter((k) => k !== config.xKey);
      datasets = dataRows.map((row) => {
        const label = String(row[config.xKey] ?? '');
        return {
          label,
          data: labels.map((col) => Number(row[col] ?? 0)),
          backgroundColor: config.colorMap?.[label] ?? config.barColor ?? '#7a7a7a',
          borderWidth: 0,
          borderRadius: 0
        };
      });
    } else if (config.yKeys && config.yKeys.length > 0) {
      labels = dataRows.map((row) => String(row[config.xKey] ?? ''));
      datasets = config.yKeys.map((key) => ({
        label: key,
        data: dataRows.map((row) => Number(row[key] ?? 0)),
        backgroundColor: config.colorMap?.[key] ?? config.barColor ?? '#7a7a7a',
        borderWidth: 0,
        borderRadius: config.stacked ? 0 : 4
      }));
    } else if (config.stacked && config.groupKey) {
      // Modo: Formato largo agrupado para apilado (p.ej. Universidad + ODS)
      const categoryKey = config.xKey;
      const groupKey = config.groupKey;
      const valueKey = config.yKey || '';

      labels = Array.from(new Set(dataRows.map((row) => String(row[categoryKey] ?? ''))));
      
      const uniqueGroups = Array.from(new Set(dataRows.map((row) => String(row[groupKey] ?? ''))))
        .sort((a, b) => {
          const numA = parseInt(a.replace(/\D/g, ''));
          const numB = parseInt(b.replace(/\D/g, ''));
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.localeCompare(b);
        });

      const dataMap = new Map<string, number>();
      dataRows.forEach((row) => {
        const cat = String(row[categoryKey] ?? '');
        const grp = String(row[groupKey] ?? '');
        const val = Number(row[valueKey] ?? 0);
        const key = `${cat}|${grp}`;
        dataMap.set(key, (dataMap.get(key) || 0) + val);
      });

      datasets = uniqueGroups.map((group) => ({
        label: group,
        data: labels.map((label) => dataMap.get(`${label}|${group}`) ?? 0),
        backgroundColor: config.colorMap?.[group] ?? config.barColor ?? '#7a7a7a',
        borderWidth: 0,
        borderRadius: 0
      }));
    } else {
      labels = dataRows.map((row) => String(row[config.xKey] ?? ''));
      const yKey = config.yKey || '';
      const values = dataRows.map((row) => Number(row[yKey] ?? 0));
      const groups = dataRows.map((row) => String(row[config.groupKey ?? ''] ?? ''));
      const fallbackColor = config.barColor ?? '#7a7a7a';
      const barColors = dataRows.map((_, index) => {
        const group = groups[index];
        if (config.groupKey && config.colorMap?.[group]) return config.colorMap[group];
        return fallbackColor;
      });
      datasets = [{
        label: config.datasetLabel || yKey,
        data: values,
        backgroundColor: barColors,
        borderWidth: 0,
        borderRadius: 4
      }];
    }

    const options = getCommonChartOptions(config);

    // Restringir zoom/pan al eje de categorías según orientación
    if (options.plugins.zoom) {
      const zoomMode = isHorizontal ? 'y' : 'x';
      (options.plugins.zoom.pan as any).mode = zoomMode;
      (options.plugins.zoom.zoom as any).mode = zoomMode;
    }

    // Para gráficos horizontales: viewport fijo + pan por el eje de categorías
    if (isHorizontal) {
      wrapper.style.height = '700px';
      // Corregir límites del plugin: el eje y es categórico (0..N-1), no numérico
      if (options.plugins.zoom) {
        (options.plugins.zoom as any).limits = {
          y: { min: 0, max: labels.length - 1, minRange: 5 }
        };
      }
    }

    (options as any).layout = {
      padding: { left: 0, right: 30, bottom: 10 }
    };

    // Escalas según orientación
    if (isHorizontal) {
      // eje X = valores, eje Y = categorías
      (options as any).scales = {
        x: {
          stacked: config.stacked,
          beginAtZero: true,
          max: config.yMax,
          title: {
            display: true,
            text: config.xAxisLabel ?? config.xKey,
            font: { weight: 'bold' }
          },
          grid: { color: '#f0f0f0' },
          ticks: {
            precision: 0,
            stepSize: 1,
            callback: function(value: any) {
              if (Math.floor(value) === value) return value;
            }
          }
        },
        y: {
          stacked: config.stacked,
          min: 0,
          max: Math.min(24, labels.length - 1), // ventana inicial: 25 universidades
          afterFit: (scaleInstance: any) => { scaleInstance.width = 300; },
          ticks: {
            autoSkip: false,
            font: getResponsiveFontSize
          },
          title: {
            display: true,
            text: config.yAxisLabel ?? '',
            font: { weight: 'bold' }
          },
          grid: { display: false }
        }
      };
    } else {
      // eje Y = valores, eje X = categorías
      (options as any).scales = {
        y: {
          afterFit: (scaleInstance: any) => { scaleInstance.width = 80; },
          stacked: config.stacked,
          beginAtZero: true,
          max: config.yMax,
          title: {
            display: true,
            text: config.yAxisLabel ?? (config.yKey || ''),
            font: { weight: 'bold' }
          },
          grid: { color: '#f0f0f0' },
          ticks: {
            precision: 0,
            stepSize: 1,
            callback: function(value: any) {
              if (Math.floor(value) === value) return value;
            }
          }
        },
        x: {
          stacked: config.stacked,
          ticks: { 
            align: 'start', 
            maxRotation: 90, 
            minRotation: 90, 
            autoSkip: false,
            font: getResponsiveFontSize
          },
          title: {
            display: true,
            text: config.xAxisLabel ?? config.xKey,
            font: { weight: 'bold' }
          },
          grid: { display: false }
        }
      };
    }

    if (config.pivotMode || config.yKeys || config.stacked) {
      // En stacked o pivotMode, el label del dataset ya identifica el grupo; no añadir afterLabel
    } else {
      (options.plugins.tooltip as any).callbacks = {
        afterLabel: (context: any) => {
          const groups = dataRows.map((row) => String(row[config.groupKey ?? ''] ?? ''));
          const group = groups[context.dataIndex];
          return group ? `ODS: ${group}` : '';
        }
      };
    }

    new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets },
      options: { ...options, indexAxis: config.indexAxis ?? 'x' } as any
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

async function buildInteractiveLineChart(
  figureEl: HTMLElement,
  config: InteractiveFigureConfig
): Promise<void> {
  const statusEl = figureEl.querySelector<HTMLElement>('.interactive-chart-status');
  const canvas = figureEl.querySelector<HTMLCanvasElement>('canvas');
  const wrapper = figureEl.querySelector<HTMLElement>('.interactive-chart-wrapper');

  if (!canvas || !wrapper) return;

  try {
    const csvUrl = resolvePublicPath(config.csvPath);
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error(`No se pudo cargar ${csvUrl} (HTTP ${response.status})`);

    const csvText = await response.text();
    const parsed = Papa.parse<CsvRow>(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });

    const dataRows = parsed.data.filter((row) => row && Object.keys(row).length > 0);
    if (!dataRows.length) throw new Error('CSV sin filas válidas');

    const labels = dataRows.map((row) => String(row[config.xKey] ?? ''));
    const keys = config.yKeys ?? (config.yKey ? [config.yKey] : []);

    const datasets = keys.map((key) => {
      const style = lineSeriesStyles[key] ?? { color: config.barColor ?? '#4472C4', dash: [] };
      return {
        label: key,
        data: dataRows.map((row) => {
          const v = row[key];
          return v !== null && v !== undefined && v !== '' ? Number(v) : null;
        }),
        borderColor: style.color,
        backgroundColor: style.color,
        borderDash: style.dash,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: style.color,
        fill: false,
        tension: 0.1,
        spanGaps: false
      };
    });

    const options = getCommonChartOptions(config);
    if (options.plugins.zoom) {
      (options.plugins.zoom.pan as any).mode = 'x';
      (options.plugins.zoom.zoom as any).mode = 'x';
    }

    (options as any).scales = {
      y: {
        beginAtZero: true,
        max: config.yMax,
        title: {
          display: !!config.yAxisLabel,
          text: config.yAxisLabel ?? '',
          font: { weight: 'bold' }
        },
        grid: { color: '#f0f0f0' }
      },
      x: {
        ticks: {
          font: getResponsiveFontSize
        },
        title: {
          display: !!config.xAxisLabel,
          text: config.xAxisLabel ?? config.xKey,
          font: { weight: 'bold' }
        },
        grid: { display: false }
      }
    };

    new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: options as any
    });

    if (statusEl) statusEl.remove();
  } catch (error) {
    console.error(error);
    if (statusEl) statusEl.textContent = 'No se pudo cargar el gráfico interactivo.';
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
      if (config.chartType === 'line') {
        await buildInteractiveLineChart(figureEl, config);
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
