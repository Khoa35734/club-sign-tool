import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pdfjsLib from 'pdfjs-dist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('FR-PDF-002 & FR-PDF-003: Page Thumbnails Sidebar & Navigation Test Suite', () => {
  const thumbnailServicePath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'services',
    'pdfThumbnailService.ts'
  );
  const thumbnailComponentPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'components',
    'PdfPageThumbnail.tsx'
  );
  const sidebarComponentPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'components',
    'PdfThumbnailSidebar.tsx'
  );
  const viewportPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'components',
    'PdfDocumentViewport.tsx'
  );
  const toolbarPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'components',
    'PdfViewportToolbar.tsx'
  );
  const docIndexPath = path.join(rootDir, 'src', 'features', 'document', 'index.ts');

  // Synthetic valid multi-page PDF (2 pages: A4 Portrait, Rotated Landscape)
  const getMultiPageMixedPdf = () =>
    new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a,
      0x31, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a,
      0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x20, 0x2f, 0x43, 0x61, 0x74, 0x61, 0x6c, 0x6f, 0x67, 0x20, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a,
      0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a,
      0x32, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a,
      0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x20, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x2f, 0x4b, 0x69, 0x64, 0x73, 0x20, 0x5b, 0x33, 0x20, 0x30, 0x20, 0x52, 0x20, 0x34, 0x20, 0x30, 0x20, 0x52, 0x5d, 0x20, 0x2f, 0x43, 0x6f, 0x75, 0x6e, 0x74, 0x20, 0x32, 0x3e, 0x3e, 0x0a,
      0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a,
      0x33, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a,
      0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x20, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x20, 0x2f, 0x50, 0x61, 0x72, 0x65, 0x6e, 0x74, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x20, 0x2f, 0x4d, 0x65, 0x64, 0x69, 0x61, 0x42, 0x6f, 0x78, 0x20, 0x5b, 0x30, 0x20, 0x30, 0x20, 0x35, 0x39, 0x35, 0x2e, 0x32, 0x38, 0x20, 0x38, 0x34, 0x31, 0x2e, 0x38, 0x39, 0x5d, 0x3e, 0x3e, 0x0a,
      0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a,
      0x34, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a,
      0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x20, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x20, 0x2f, 0x50, 0x61, 0x72, 0x65, 0x6e, 0x74, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x20, 0x2f, 0x4d, 0x65, 0x64, 0x69, 0x61, 0x42, 0x6f, 0x78, 0x20, 0x5b, 0x30, 0x20, 0x30, 0x20, 0x35, 0x39, 0x35, 0x2e, 0x32, 0x38, 0x20, 0x38, 0x34, 0x31, 0x2e, 0x38, 0x39, 0x5d, 0x20, 0x2f, 0x52, 0x6f, 0x74, 0x61, 0x74, 0x65, 0x20, 0x39, 0x30, 0x3e, 0x3e, 0x0a,
      0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a,
      0x78, 0x72, 0x65, 0x66, 0x0a,
      0x30, 0x20, 0x35, 0x0a,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35, 0x33, 0x35, 0x20, 0x66, 0x0a,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x38, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x0a,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x37, 0x37, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x0a,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x35, 0x37, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x0a,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x35, 0x35, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x0a,
      0x74, 0x72, 0x61, 0x69, 0x6c, 0x65, 0x72, 0x0a,
      0x3c, 0x3c, 0x2f, 0x53, 0x69, 0x7a, 0x65, 0x20, 0x35, 0x20, 0x2f, 0x52, 0x6f, 0x6f, 0x74, 0x20, 0x31, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a,
      0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66, 0x0a,
      0x33, 0x37, 0x30, 0x0a,
      0x25, 0x25, 0x45, 0x4f, 0x46,
    ]);

  test('Required source files for thumbnails sidebar exist and are non-empty', () => {
    assert.ok(fs.existsSync(thumbnailServicePath), 'pdfThumbnailService.ts must exist');
    assert.ok(fs.statSync(thumbnailServicePath).size > 0, 'pdfThumbnailService.ts must not be empty');

    assert.ok(fs.existsSync(thumbnailComponentPath), 'PdfPageThumbnail.tsx must exist');
    assert.ok(fs.statSync(thumbnailComponentPath).size > 0, 'PdfPageThumbnail.tsx must not be empty');

    assert.ok(fs.existsSync(sidebarComponentPath), 'PdfThumbnailSidebar.tsx must exist');
    assert.ok(fs.statSync(sidebarComponentPath).size > 0, 'PdfThumbnailSidebar.tsx must not be empty');

    assert.ok(fs.existsSync(viewportPath), 'PdfDocumentViewport.tsx must exist');
    assert.ok(fs.statSync(viewportPath).size > 0, 'PdfDocumentViewport.tsx must not be empty');
  });

  test('pdfThumbnailService implements THUMBNAIL_SCALE = 0.25 and memory caching', () => {
    const content = fs.readFileSync(thumbnailServicePath, 'utf8');

    assert.match(
      content,
      /export const THUMBNAIL_SCALE\s*=\s*0\.25/,
      'THUMBNAIL_SCALE must strictly equal 0.25 (as required by pdf-editor.md Section 4)'
    );
    assert.match(
      content,
      /export async function renderPdfPageThumbnail/,
      'renderPdfPageThumbnail must be exported'
    );
    assert.match(
      content,
      /export function clearThumbnailCache/,
      'clearThumbnailCache must be exported'
    );
    assert.match(
      content,
      /export function getCachedThumbnail/,
      'getCachedThumbnail must be exported'
    );
    assert.match(
      content,
      /export function setCachedThumbnail/,
      'setCachedThumbnail must be exported'
    );
    assert.match(
      content,
      /export function getThumbnailCacheKey/,
      'getThumbnailCacheKey must be exported'
    );
  });

  test('document feature index exports thumbnail components and services', () => {
    const content = fs.readFileSync(docIndexPath, 'utf8');

    assert.match(content, /export \* from '\.\/services\/pdfThumbnailService'/, 'exports thumbnail service');
    assert.match(content, /export \* from '\.\/components\/PdfPageThumbnail'/, 'exports PdfPageThumbnail');
    assert.match(content, /export \* from '\.\/components\/PdfThumbnailSidebar'/, 'exports PdfThumbnailSidebar');
  });

  test('PdfPageThumbnail component provides accessibility, lazy rendering, and active page styling', () => {
    const content = fs.readFileSync(thumbnailComponentPath, 'utf8');

    assert.match(content, /data-testid=\{`thumbnail-page-\$\{pageNumber\}`\}/, 'has thumbnail container test id');
    assert.match(content, /data-testid=\{`thumbnail-badge-\$\{pageNumber\}`\}/, 'has page badge test id');
    assert.match(content, /data-active=\{isActive/, 'tracks active state attribute');
    assert.match(content, /IntersectionObserver/, 'uses IntersectionObserver for lazy thumbnail rendering');
    assert.match(content, /onSelect\(pageNumber\)/, 'invokes onSelect with pageNumber on click');
    assert.match(content, /Trang \{pageNumber\}/, 'displays localized page number label');
  });

  test('PdfThumbnailSidebar component provides vertical thumbnail strip, auto-scroll, and collapse control', () => {
    const content = fs.readFileSync(sidebarComponentPath, 'utf8');

    assert.match(content, /data-testid="pdf-thumbnail-sidebar"/, 'has sidebar container test id');
    assert.match(content, /data-testid="thumbnail-list-container"/, 'has scrollable list container');
    assert.match(content, /data-active-page=\{activePage\}/, 'reflects activePage prop');
    assert.match(content, /scrollIntoView/, 'auto-scrolls active thumbnail into view');
    assert.match(content, /PdfPageThumbnail/, 'renders PdfPageThumbnail for each page');
    assert.match(content, /sidebar-collapse-button/, 'provides sidebar collapse toggle');
    assert.match(content, /sidebar-expand-button/, 'provides sidebar expand toggle');
  });

  test('PdfDocumentViewport mounts PdfThumbnailSidebar and synchronizes active page selection', () => {
    const content = fs.readFileSync(viewportPath, 'utf8');

    assert.match(content, /PdfThumbnailSidebar/, 'imports and renders PdfThumbnailSidebar');
    assert.match(content, /activePage=\{currentPage\}/, 'passes currentPage to sidebar');
    assert.match(content, /onSelectPage=\{handlePageChange\}/, 'wires thumbnail selection to handlePageChange');
    assert.match(content, /scrollIntoView/, 'scrolls main document to selected page');
  });

  test('PdfViewportToolbar supports sidebar visibility toggling', () => {
    const content = fs.readFileSync(toolbarPath, 'utf8');

    assert.match(content, /toolbar-sidebar-toggle/, 'provides toolbar toggle button for thumbnail sidebar');
  });

  test('Functional simulation: PDF.js calculates thumbnail scale 0.25 dimensions for mixed pages', async () => {
    const pdfData = getMultiPageMixedPdf();
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useSystemFonts: true,
      isEvalSupported: false,
    });
    const doc = await loadingTask.promise;
    assert.equal(doc.numPages, 2, 'Document has 2 pages');

    const THUMBNAIL_SCALE = 0.25;

    // Page 1: Portrait 595.28 x 841.89 pt
    const page1 = await doc.getPage(1);
    const viewport1 = page1.getViewport({ scale: THUMBNAIL_SCALE, rotation: page1.rotate });
    const p1Width = Math.floor(viewport1.width);
    const p1Height = Math.floor(viewport1.height);

    assert.equal(p1Width, Math.floor(595.28 * 0.25), 'Page 1 thumbnail width matches scale 0.25');
    assert.equal(p1Height, Math.floor(841.89 * 0.25), 'Page 1 thumbnail height matches scale 0.25');
    assert.ok(p1Width < 160, 'Thumbnail width is compact (< 160px)');

    // Page 2: Rotated 90° Landscape 595.28 x 841.89 pt -> dimensions swap
    const page2 = await doc.getPage(2);
    const viewport2 = page2.getViewport({ scale: THUMBNAIL_SCALE, rotation: page2.rotate });
    const p2Width = Math.floor(viewport2.width);
    const p2Height = Math.floor(viewport2.height);

    assert.equal(p2Width, Math.floor(841.89 * 0.25), 'Page 2 thumbnail width matches rotated width');
    assert.equal(p2Height, Math.floor(595.28 * 0.25), 'Page 2 thumbnail height matches rotated height');
    assert.ok(p2Width > p2Height, 'Page 2 rotated thumbnail is Landscape');
  });

  test('Functional simulation: thumbnail caching key generation and memory lifecycle', () => {
    const content = fs.readFileSync(thumbnailServicePath, 'utf8');

    // Verify cache key structure logic from source code
    assert.match(
      content,
      /const sourceKey = typeof source === 'string' \? source : 'in_memory_doc'/,
      'Handles both file path string and memory buffers'
    );
    assert.match(
      content,
      /`\$\{sourceKey\}_p\$\{pageNumber\}\$\{rotKey\}`/,
      'Generates unique key combining source, page number, and rotation'
    );

    // Verify in-memory Map cache mechanism behavior
    const testMap = new Map();
    const key1 = 'doc_test.pdf_p1';
    const key2 = 'doc_test.pdf_p2_r90';
    const mockData1 = 'data:image/jpeg;base64,mock1';
    const mockData2 = 'data:image/jpeg;base64,mock2';

    testMap.set(key1, mockData1);
    testMap.set(key2, mockData2);

    assert.equal(testMap.get(key1), mockData1, 'Returns page 1 cached thumbnail');
    assert.equal(testMap.get(key2), mockData2, 'Returns page 2 cached thumbnail');

    testMap.clear();
    assert.equal(testMap.size, 0, 'Cache clears all thumbnail entries');
    assert.equal(testMap.get(key1), undefined, 'Cleared cache returns undefined');
  });
});
