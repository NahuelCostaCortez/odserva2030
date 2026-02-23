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