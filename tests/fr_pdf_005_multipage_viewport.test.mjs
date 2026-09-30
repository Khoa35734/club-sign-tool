import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pdfjsLib from 'pdfjs-dist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('FR-PDF-005: Multi-Page Vertical Scrolling & Viewport Test Suite', () => {
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
  const pageViewPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'components',
    'PdfPageView.tsx'
  );
  const editorStorePath = path.join(rootDir, 'src', 'stores', 'useEditorStore.ts');
  const storesIndexPath = path.join(rootDir, 'src', 'stores', 'index.ts');
  const docIndexPath = path.join(rootDir, 'src', 'features', 'document', 'index.ts');
  const appPath = path.join(rootDir, 'src', 'App.tsx');

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
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35, 0x35, 0x33, 0x35, 0x20, 0x66, 0x0a,
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

  test('Required source files for multi-page viewport exist and are non-empty', () => {
    assert.ok(fs.existsSync(viewportPath), 'PdfDocumentViewport.tsx must exist');
    assert.ok(fs.statSync(viewportPath).size > 0, 'PdfDocumentViewport.tsx must not be empty');

    assert.ok(fs.existsSync(toolbarPath), 'PdfViewportToolbar.tsx must exist');
    assert.ok(fs.statSync(toolbarPath).size > 0, 'PdfViewportToolbar.tsx must not be empty');

    assert.ok(fs.existsSync(pageViewPath), 'PdfPageView.tsx must exist');
    assert.ok(fs.statSync(pageViewPath).size > 0, 'PdfPageView.tsx must not be empty');

    assert.ok(fs.existsSync(editorStorePath), 'useEditorStore.ts must exist');
    assert.ok(fs.statSync(editorStorePath).size > 0, 'useEditorStore.ts must not be empty');
  });

  test('useEditorStore implements activePageIndex and zoomLevel management', () => {
    const content = fs.readFileSync(editorStorePath, 'utf8');

    assert.match(content, /export const useEditorStore/, 'useEditorStore must be exported');
    assert.match(content, /activePageIndex:\s*0/, 'initial activePageIndex must be 0');
    assert.match(content, /setActivePageIndex:/, 'must implement setActivePageIndex');
    assert.match(content, /setZoomLevel:/, 'must implement setZoomLevel');
    assert.match(content, /Math\.max\(0,\s*activePageIndex\)/, 'activePageIndex must not be negative');
    assert.match(content, /Math\.min\(4\.0,\s*Math\.max\(0\.25,\s*zoomLevel\)\)/, 'zoomLevel must be clamped between 0.25 and 4.0');

    const indexContent = fs.readFileSync(storesIndexPath, 'utf8');
    assert.match(indexContent, /export \* from '\.\/useEditorStore'/, 'stores/index.ts must export useEditorStore');
  });

  test('PdfViewportToolbar supports continuous and single view modes and page stepping', () => {
    const content = fs.readFileSync(toolbarPath, 'utf8');

    assert.match(content, /export function PdfViewportToolbar/, 'PdfViewportToolbar must be exported');
    assert.match(content, /data-testid="pdf-viewport-toolbar"/, 'Toolbar must have testid');
    assert.match(content, /data-testid="viewport-mode-continuous"/, 'Must have continuous mode button');
    assert.match(content, /data-testid="viewport-mode-single"/, 'Must have single page mode button');
    assert.match(content, /data-testid="viewport-page-indicator"/, 'Must have page indicator');
    assert.match(content, /data-testid="viewport-prev-button"/, 'Must have prev page button');
    assert.match(content, /data-testid="viewport-next-button"/, 'Must have next page button');
    assert.match(content, /disabled=\{isFirstPage\}/, 'Prev button must be disabled on first page');
    assert.match(content, /disabled=\{isLastPage\}/, 'Next button must be disabled on last page');
  });

  test('PdfDocumentViewport implements vertical scrolling container and multi-page rendering', () => {
    const content = fs.readFileSync(viewportPath, 'utf8');

    assert.match(content, /export function PdfDocumentViewport/, 'PdfDocumentViewport must be exported');
    assert.match(content, /data-testid="pdf-document-viewport-root"/, 'Must have root container testid');
    assert.match(content, /data-testid="pdf-document-viewport"/, 'Must have scrollable viewport testid');
    assert.match(content, /data-testid="continuous-page-list"/, 'Must have continuous page list in continuous mode');
    assert.match(content, /data-testid="single-page-view"/, 'Must have single page view in single mode');
    assert.match(content, /scroll-smooth/, 'Must configure smooth scrolling');
    assert.match(content, /overflow-y-auto/, 'Must configure vertical scrolling');
    assert.match(content, /id=\{`pdf-page-\$\{page\.pageNumber\}`\}/, 'Must assign unique page anchor IDs');
    assert.match(content, /scrollIntoView/, 'Must support programmatic smooth scroll to page');

    const docIndexContent = fs.readFileSync(docIndexPath, 'utf8');
    assert.match(docIndexContent, /export \* from '\.\/components\/PdfDocumentViewport'/, 'document/index.ts must export PdfDocumentViewport');
    assert.match(docIndexContent, /export \* from '\.\/components\/PdfViewportToolbar'/, 'document/index.ts must export PdfViewportToolbar');
  });

  test('App component mounts PdfDocumentViewport for multi-page active documents', () => {
    const content = fs.readFileSync(appPath, 'utf8');

    assert.match(content, /PdfDocumentViewport/, 'App must import and mount PdfDocumentViewport');
    assert.match(content, /pages=\{activeDocument\.pages\}/, 'App must pass document pages to viewport');
    assert.match(content, /source=\{activeDocument\.filePath\}/, 'App must pass file path to viewport');
  });

  test('PdfPageView supports lazy rendering and explicit dimensions', () => {
    const content = fs.readFileSync(pageViewPath, 'utf8');

    assert.match(content, /lazy = false/, 'Must accept lazy prop with default false');
    assert.match(content, /widthPt = 595\.28/, 'Must accept widthPt with A4 default');
    assert.match(content, /heightPt = 841\.89/, 'Must accept heightPt with A4 default');
    assert.match(content, /data-testid="pdf-page-placeholder"/, 'Must render placeholder when lazy element is not in view');
    assert.match(content, /IntersectionObserver/, 'Must leverage IntersectionObserver for lazy mounting');
  });

  test('Functional simulation: Multi-page mixed PDF loads and renders all pages sequentially', async () => {
    const data = getMultiPageMixedPdf();
    const loadingTask = pdfjsLib.getDocument({
      data,
      useSystemFonts: true,
      isEvalSupported: false,
    });
    const doc = await loadingTask.promise;

    assert.equal(doc.numPages, 2, 'Multi-page document must contain 2 pages');

    // Page 1: Portrait A4
    const page1 = await doc.getPage(1);
    const vp1 = page1.getViewport({ scale: 150 / 72 });
    assert.equal(Math.floor(vp1.width), 1240, 'Page 1 pixel width at 150 DPI must be 1240');
    assert.equal(Math.floor(vp1.height), 1753, 'Page 1 pixel height at 150 DPI must be 1753');

    // Page 2: Rotated Landscape 90 deg
    const page2 = await doc.getPage(2);
    const vp2 = page2.getViewport({ scale: 150 / 72 });
    assert.equal(page2.rotate, 90, 'Page 2 must have 90 degree rotation');
    assert.equal(Math.floor(vp2.width), 1753, 'Page 2 rotated pixel width at 150 DPI must be 1753');
    assert.equal(Math.floor(vp2.height), 1240, 'Page 2 rotated pixel height at 150 DPI must be 1240');
  });
});
