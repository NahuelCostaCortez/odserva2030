import { marked } from 'marked';

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

marked.setOptions({ breaks: true });

function groupBySection<T extends { sectionId: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    if (!map.has(item.sectionId)) {
      map.set(item.sectionId, []);
    }
    map.get(item.sectionId)?.push(item);
  }
  return map;
}

function renderTables(container: Element, tables: Table[]) {
  container.innerHTML = '';
  tables.forEach((table) => {
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
    container.appendChild(block);
  });
}

function renderFigures(container: Element, figures: Figure[]) {
  container.innerHTML = '';
  if (!figures.length) return;
  const grid = document.createElement('div');
  grid.className = 'figure-grid';
  figures.forEach((figure) => {
    const fig = document.createElement('figure');
    const img = document.createElement('img');
    img.src = figure.src;
    img.alt = figure.caption || 'Figura del informe';
    img.loading = 'lazy';
    fig.appendChild(img);
    if (figure.caption || figure.page !== null) {
      const caption = document.createElement('figcaption');
      if (figure.caption) {
        const span = document.createElement('span');
        span.textContent = figure.caption;
        caption.appendChild(span);
      }
      if (figure.page !== null) {
        const pageChip = document.createElement('span');
        pageChip.className = 'page-chip';
        pageChip.textContent = `Pág. ${figure.page}`;
        caption.appendChild(pageChip);
      }
      fig.appendChild(caption);
    }
    grid.appendChild(fig);
  });
  container.appendChild(grid);
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
    const tablesBySection = groupBySection(data.tables);
    const figuresBySection = groupBySection(data.figures);
    const sectionBlocks = container.querySelectorAll<HTMLElement>('[data-section-block]');
    sectionBlocks.forEach((block) => {
      const sectionId = block.dataset.sectionBlock;
      if (!sectionId) return;
      const sectionData = data.sections.find((section) => section.id === sectionId);
      const contentEl = block.querySelector<HTMLElement>('[data-section-content]');
      if (contentEl && sectionData?.content) {
        contentEl.innerHTML = marked.parse(sectionData.content);
      }
      const tablesEl = block.querySelector<HTMLElement>('[data-section-tables]');
      if (tablesEl) {
        const tables = tablesBySection.get(sectionId) ?? [];
        renderTables(tablesEl, tables);
      }
      const figuresEl = block.querySelector<HTMLElement>('[data-section-figures]');
      if (figuresEl) {
        const figures = figuresBySection.get(sectionId) ?? [];
        renderFigures(figuresEl, figures);
      }
    });
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
