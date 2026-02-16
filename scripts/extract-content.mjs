import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const MARKDOWN_DIR = path.join(ROOT, 'markdown');
const OUTPUT_DIR = path.join(ROOT, 'web', 'src', 'content', 'work-packages');
const DATA_OUTPUT_DIR = path.join(ROOT, 'web', 'public', 'data');
const MEDIA_DIR = path.join(ROOT, 'web', 'public', 'assets');
const MANIFEST_PATH = path.join(ROOT, 'web', 'src', 'data', 'media-manifest.json');

const TABLE_DIVIDER_REGEX = /^\s*\|?\s*[:\- ]+\|[:\- \|]*$/;
const TABLE_ROW_REGEX = /^\s*\|.*\|\s*$/;
const FIGURE_FILENAME_REGEX = /_Figure_/i;
const PAGE_REGEX = /_page_(\d+)/i;
const FIGURE_INDEX_REGEX = /_(Figure|Table)_(\d+)/i;

async function ensureDirs() {
  await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  await fs.rm(DATA_OUTPUT_DIR, { recursive: true, force: true });
  await fs.rm(MEDIA_DIR, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(DATA_OUTPUT_DIR, { recursive: true });
  await fs.mkdir(MEDIA_DIR, { recursive: true });
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function cleanHeadingText(value) {
  return value.replace(/^[*_`\s]+|[*_`\s]+$/g, '').trim();
}

function summarizeSection(section) {
  if (!section || !section.content) return '';
  const text = section.content.replace(/\s+/g, ' ').trim();
  const words = text.split(/\s+/);
  const limit = 48;
  const summary = words.slice(0, limit).join(' ');
  return words.length > limit ? `${summary}…` : summary;
}

function parseTableBlock(lines, startIndex) {
  const block = [];
  let i = startIndex;
  for (; i < lines.length; i += 1) {
    const candidate = lines[i];
    if (TABLE_ROW_REGEX.test(candidate) || TABLE_DIVIDER_REGEX.test(candidate)) {
      block.push(candidate);
      continue;
    }
    break;
  }
  return { block, nextIndex: i };
}

function detectLabel(lines, startIndex) {
  for (let i = startIndex; i >= 0; i -= 1) {
    const candidate = lines[i].trim();
    if (!candidate.length) continue;
    if (/^(tabla|table|cuadro|figura)/i.test(candidate)) {
      return cleanHeadingText(candidate);
    }
    break;
  }
  return undefined;
}

function tableToRows(block) {
  const filtered = block.filter((line) => line.trim().length > 0);
  if (filtered.length === 0) {
    return { headers: [], rows: [] };
  }
  const parseRow = (line) =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());
  const headers = parseRow(filtered[0]);
  let dataLines = filtered.slice(1);
  if (dataLines.length && TABLE_DIVIDER_REGEX.test(filtered[1])) {
    dataLines = filtered.slice(2);
  }
  const rows = dataLines.map(parseRow);
  return { headers, rows };
}

function extractFigures(line, dirContext) {
  const match = line.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (!match) return null;
  const relativePath = match[1];
  if (!FIGURE_FILENAME_REGEX.test(relativePath)) {
    return null;
  }
  const absolutePath = path.join(dirContext.fullPath, relativePath);
  const filename = path.basename(relativePath);
  const pageMatch = relativePath.match(PAGE_REGEX);
  const figureIndexMatch = relativePath.match(FIGURE_INDEX_REGEX);
  const page = pageMatch ? Number(pageMatch[1]) : null;
  const label = figureIndexMatch ? `${figureIndexMatch[1]} ${figureIndexMatch[2]}` : null;
  return { absolutePath, filename, page, label };
}

function parseMarkdown(raw, dirContext) {
  const lines = raw.split(/\r?\n/);
  const sections = [];
  const tables = [];
  const figures = [];
  let currentSection = null;
  let sectionOrder = 0;
  let tableCount = 0;
  let figureCount = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s*(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      if (level > 3) {
        currentSection = null;
        continue;
      }
      const rawTitle = headingMatch[2].trim();
      const title = cleanHeadingText(rawTitle);
      const sectionId = `${dirContext.slug}-${slugify(title) || `section-${sectionOrder + 1}`}`;
      currentSection = {
        id: sectionId,
        slug: sectionId,
        title,
        level,
        order: sectionOrder,
        content: ''
      };
      sections.push(currentSection);
      sectionOrder += 1;
      continue;
    }

    if (!currentSection) {
      continue;
    }

    if (TABLE_ROW_REGEX.test(line)) {
      const tableStartIndex = i;
      const { block, nextIndex } = parseTableBlock(lines, i);
      i = nextIndex - 1;
      const { headers, rows } = tableToRows(block);
      if (headers.length || rows.length) {
        tableCount += 1;
        tables.push({
          id: `${dirContext.slug}-table-${tableCount}`,
          sectionId: currentSection.id,
          label: detectLabel(lines, tableStartIndex - 1) ?? undefined,
          markdown: block.join('\n'),
          headers,
          rows,
          page: null
        });
      }
      continue;
    }

    if (line.includes('![')) {
      const figure = extractFigures(line, dirContext);
      if (figure) {
        figureCount += 1;
        figures.push({
          id: `${dirContext.slug}-figure-${figureCount}`,
          sectionId: currentSection.id,
          page: figure.page,
          label: figure.label,
          absolutePath: figure.absolutePath,
          filename: figure.filename
        });
        continue;
      }
      continue;
    }

    if (line.trim().length === 0 && currentSection.content.endsWith('\n\n')) {
      continue;
    }

    currentSection.content += (currentSection.content ? '\n' : '') + line;
  }

  sections.forEach((section) => {
    section.content = section.content.trim();
  });
  const title = sections.find((section) => section.level === 1)?.title ?? dirContext.fallbackTitle;
  return { sections, tables, figures, title };
}

async function copyFigureAsset(figure, dirContext) {
  const packageAssetDir = path.join(MEDIA_DIR, dirContext.code.toLowerCase());
  await fs.mkdir(packageAssetDir, { recursive: true });
  const destination = path.join(packageAssetDir, figure.filename);
  await fs.copyFile(figure.absolutePath, destination);
  return {
    id: figure.id,
    sectionId: figure.sectionId,
    src: `/assets/${dirContext.code.toLowerCase()}/${figure.filename}`,
    page: figure.page,
    caption: figure.label ?? ''
  };
}

async function processPackage(dirent) {
  const dirName = dirent.name;
  const fullPath = path.join(MARKDOWN_DIR, dirName);
  const mdFiles = (await fs.readdir(fullPath)).filter((file) => file.endsWith('.md'));
  if (mdFiles.length === 0) {
    return null;
  }
  const mdPath = path.join(fullPath, mdFiles[0]);
  const raw = await fs.readFile(mdPath, 'utf8');
  const codeMatch = dirName.match(/(O\d+)/i);
  const code = codeMatch ? codeMatch[1].toUpperCase() : dirName;
  const slug = code.toLowerCase();
  const dirContext = { fullPath, code, slug, fallbackTitle: dirName };
  const { sections, tables, figures, title } = parseMarkdown(raw, dirContext);

  const copiedFigures = [];
  for (const figure of figures) {
    const copied = await copyFigureAsset(figure, dirContext);
    copiedFigures.push(copied);
  }

  const summarySource = sections.find((section) => section.content) ?? sections[0];
  const sectionsIndex = sections.map(({ id, slug: sectionSlug, title: sectionTitle, level, order }) => ({
    id,
    slug: sectionSlug,
    title: sectionTitle,
    level,
    order
  }));

  const meta = {
    code,
    slug,
    title,
    summary: summarySource ? summarizeSection(summarySource) : '',
    updatedAt: new Date().toISOString(),
    sourcePath: path.relative(ROOT, mdPath),
    counts: {
      sections: sections.length,
      tables: tables.length,
      figures: copiedFigures.length
    },
    sectionsIndex,
    dataPath: `/data/${slug}.json`
  };

  const payload = {
    sections,
    tables,
    figures: copiedFigures
  };

  return { meta, payload, manifest: copiedFigures.map((figure) => ({ ...figure, packageCode: code })) };
}

async function main() {
  await ensureDirs();
  const manifest = [];
  const dirEntries = await fs.readdir(MARKDOWN_DIR, { withFileTypes: true });
  for (const dirent of dirEntries) {
    if (!dirent.isDirectory()) continue;
    const pkg = await processPackage(dirent);
    if (!pkg) continue;
    await fs.writeFile(path.join(OUTPUT_DIR, `${pkg.meta.slug}.json`), JSON.stringify(pkg.meta, null, 2), 'utf8');
    await fs.writeFile(
      path.join(DATA_OUTPUT_DIR, `${pkg.meta.slug}.json`),
      JSON.stringify(pkg.payload, null, 2),
      'utf8'
    );
    manifest.push(
      ...pkg.manifest.map((entry) => ({
        id: entry.id,
        packageCode: entry.packageCode,
        sectionId: entry.sectionId,
        src: entry.src,
        page: entry.page
      }))
    );
    console.log(`Processed ${pkg.meta.code}`);
  }
  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('Done.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
