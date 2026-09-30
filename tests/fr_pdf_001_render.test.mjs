import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pdfjsLib from 'pdfjs-dist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('FR-PDF-001: PDF Page 1 High-Resolution Canvas Rendering Test Suite', () => {
  const pdfRenderUtilPath = path.join(rootDir, 'src', 'utils', 'pdfRender.ts');
  const pdfRenderServicePath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'services',
    'pdfRenderService.ts'
  );
  const pdfWorkerSetupPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'services',
    'pdfWorkerSetup.ts'
  );
  const pdfRendererHookPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'hooks',
    'usePdfPageRenderer.ts'
  );
  const pdfPageViewComponentPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'components',
    'PdfPageView.tsx'
  );
  const docIndexPath = path.join(rootDir, 'src', 'features', 'document', 'index.ts');
  const utilsIndexPath = path.join(rootDir, 'src', 'utils', 'index.ts');
  const appPath = path.join(rootDir, 'src', 'App.tsx');

  // Synthetic valid A4 single-page PDF binary (595.28 x 841.89 pt)
  const getSinglePageA4Pdf = () =>
    new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a,
      0x31, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a,
      0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x20, 0x2f, 0x43, 0x61, 0x74, 0x61, 0x6c, 0x6f, 0x67, 0x20, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a,
      0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a,
      0x32, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a,
      0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x20, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x2f, 0x4b, 0x69, 0x64, 0x73, 0x20, 0x5b, 0x33, 0x20, 0x30, 0x20, 0x52, 0x5d, 0x20, 0x2f, 0x43, 0x6f, 0x75, 0x6e, 0x74, 0x20, 0x31, 0x3e, 0x3e, 0x0a,
      0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a,
      0x33, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a,
      0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x20, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x20, 0x2f, 0x50, 0x61, 0x72, 0x65, 0x6e, 0x74, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x20, 0x2f, 0x4d, 0x65, 0x64, 0x69, 0x61, 0x42, 0x6f, 0x78, 0x20, 0x5b, 0x30, 0x20, 0x30, 0x20, 0x35, 0x39, 0x35, 0x2e, 0x32, 0x38, 0x20, 0x38, 0x34, 0x31, 0x2e, 0x38, 0x39, 0x5d, 0x3e, 0x3e, 0x0a,
      0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a,
      0x78, 0x72, 0x65, 0x66, 0x0a,
      0x30, 0x20, 0x34, 0x0a,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35, 0x35, 0x33, 0x35, 0x20, 0x66, 0x0a,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x38, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x0a,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x37, 0x37, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x0a,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x34, 0x37, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x0a,
      0x74, 0x72, 0x61, 0x69, 0x6c, 0x65, 0x72, 0x0a,
      0x3c, 0x3c, 0x2f, 0x53, 0x69, 0x7a, 0x65, 0x20, 0x34, 0x20, 0x2f, 0x52, 0x6f, 0x6f, 0x74, 0x20, 0x31, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a,
      0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66, 0x0a,
      0x32, 0x34, 0x35, 0x0a,
      0x25, 0x25, 0x45, 0x4f, 0x46,
    ]);

  test('Required source files for PDF page 1 high-resolution rendering exist and are non-empty', () => {
    assert.ok(fs.existsSync(pdfRenderUtilPath), 'pdfRender.ts must exist');
    assert.ok(fs.statSync(pdfRenderUtilPath).size > 0, 'pdfRender.ts must not be empty');

    assert.ok(fs.existsSync(pdfRenderServicePath), 'pdfRenderService.ts must exist');
    assert.ok(fs.statSync(pdfRenderServicePath).size > 0, 'pdfRenderService.ts must not be empty');

    assert.ok(fs.existsSync(pdfWorkerSetupPath), 'pdfWorkerSetup.ts must exist');
    assert.ok(fs.statSync(pdfWorkerSetupPath).size > 0, 'pdfWorkerSetup.ts must not be empty');

    assert.ok(fs.existsSync(pdfRendererHookPath), 'usePdfPageRenderer.ts must exist');
    assert.ok(fs.statSync(pdfRendererHookPath).size > 0, 'usePdfPageRenderer.ts must not be empty');

    assert.ok(fs.existsSync(pdfPageViewComponentPath), 'PdfPageView.tsx must exist');
    assert.ok(fs.statSync(pdfPageViewComponentPath).size > 0, 'PdfPageView.tsx must not be empty');
  });

  test('pdfRender.ts defines MIN_PDF_RENDER_DPI >= 150 and pure scaling functions', () => {
    const content = fs.readFileSync(pdfRenderUtilPath, 'utf8');

    assert.match(content, /MIN_PDF_RENDER_DPI\s*=\s*150/, 'MIN_PDF_RENDER_DPI must be at least 150');
    assert.match(content, /PDF_POINTS_PER_INCH\s*=\s*72/, 'PDF_POINTS_PER_INCH must be 72');
    assert.match(content, /export function calculateEffectiveDpi/, 'calculateEffectiveDpi must be exported');
    assert.match(content, /export function calculateRenderScale/, 'calculateRenderScale must be exported');
    assert.match(content, /export function calculatePageCanvasDimensions/, 'calculatePageCanvasDimensions must be exported');

    const utilsIndex = fs.readFileSync(utilsIndexPath, 'utf8');
    assert.match(utilsIndex, /export \* from '\.\/pdfRender'/, 'utils/index.ts must export pdfRender');
  });

  test('pdfRenderService.ts implements getPdfDocument and renderPdfPageToCanvas with min 150 DPI', () => {
    const content = fs.readFileSync(pdfRenderServicePath, 'utf8');

    assert.match(content, /export async function getPdfDocument/, 'getPdfDocument must be exported');
    assert.match(content, /export function clearPdfDocumentCache/, 'clearPdfDocumentCache must be exported');
    assert.match(content, /export async function renderPdfPageToCanvas/, 'renderPdfPageToCanvas must be exported');
    assert.match(content, /MIN_PDF_RENDER_DPI/, 'Must reference MIN_PDF_RENDER_DPI');
    assert.match(content, /RenderingCancelledException/, 'Must handle RenderingCancelledException gracefully');
    assert.match(content, /ensurePdfWorkerConfigured/, 'Must invoke ensurePdfWorkerConfigured');
  });

  test('usePdfPageRenderer hook implements async render lifecycle, cancellation, and retry', () => {
    const content = fs.readFileSync(pdfRendererHookPath, 'utf8');

    assert.match(content, /export function usePdfPageRenderer/, 'usePdfPageRenderer must be exported');
    assert.match(content, /activeTaskRef\.current\.cancel\(\)/, 'Must cancel previous in-flight task');
    assert.match(content, /retry/, 'Must expose retry method');
    assert.match(content, /isRendering/, 'Must expose isRendering state');
    assert.match(content, /error/, 'Must expose error state');
    assert.match(content, /lastRenderResult/, 'Must expose lastRenderResult state');
  });

  test('PdfPageView component renders accessible canvas and high-resolution info badge', () => {
    const content = fs.readFileSync(pdfPageViewComponentPath, 'utf8');

    assert.match(content, /export function PdfPageView/, 'PdfPageView component must be exported');
    assert.match(content, /data-testid="pdf-page-canvas"/, 'Canvas must have testid pdf-page-canvas');
    assert.match(content, /role="img"/, 'Canvas must have role img for accessibility');
    assert.match(content, /data-testid="pdf-page-loading-overlay"/, 'Must have loading overlay');
    assert.match(content, /data-testid="pdf-page-error-overlay"/, 'Must have error overlay');
    assert.match(content, /data-testid="pdf-page-info-badge"/, 'Must have page info badge');

    const docIndex = fs.readFileSync(docIndexPath, 'utf8');
    assert.match(docIndex, /export \* from '\.\/components\/PdfPageView'/, 'document/index.ts must export PdfPageView');
    assert.match(docIndex, /export \* from '\.\/hooks\/usePdfPageRenderer'/, 'document/index.ts must export usePdfPageRenderer');
    assert.match(docIndex, /export \* from '\.\/services\/pdfRenderService'/, 'document/index.ts must export pdfRenderService');
  });

  test('App component mounts PDF viewport for active PDF documents', () => {
    const content = fs.readFileSync(appPath, 'utf8');

    assert.match(content, /PdfPageView|PdfDocumentViewport/, 'App must import and use PDF viewer');
    assert.match(content, /activeDocument\.fileType === 'pdf'/, 'App must render viewer when active document is PDF');
    assert.match(content, /source=\{activeDocument\.filePath\}/, 'App must pass active document path');
  });

  test('Functional simulation: PDF.js renders Page 1 at min 150 DPI viewport scale', async () => {
    const pdfData = getSinglePageA4Pdf();
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useSystemFonts: true,
      isEvalSupported: false,
    });
    const doc = await loadingTask.promise;

    assert.equal(doc.numPages, 1, 'Single-page PDF must have 1 page');
    const page = await doc.getPage(1);

    // 150 DPI scale relative to 72 points/inch
    const dpi = 150;
    const scale = dpi / 72; // ~2.0833333333333335
    assert.ok(scale >= 2.08, 'Scale at 150 DPI must be >= 2.08');

    const viewport = page.getViewport({ scale });

    // A4: 595.28 x 841.89 pt -> at 150 DPI: 1240.16 x 1753.93 px
    const pixelWidth = Math.floor(viewport.width);
    const pixelHeight = Math.floor(viewport.height);

    assert.equal(pixelWidth, 1240, 'Canvas buffer width at 150 DPI must be 1240 px');
    assert.equal(pixelHeight, 1753, 'Canvas buffer height at 150 DPI must be 1753 px');

    // Display 1x viewport
    const displayViewport = page.getViewport({ scale: 1.0 });
    const displayWidth = Math.round(displayViewport.width);
    const displayHeight = Math.round(displayViewport.height);

    assert.equal(displayWidth, 595, 'CSS display width must be 595 px');
    assert.equal(displayHeight, 842, 'CSS display height must be 842 px');

    // Pixel density verification:
    const calculatedDpi = (pixelWidth / (displayWidth / 72));
    assert.ok(calculatedDpi >= 150, `Effective DPI must be >= 150 (got ${calculatedDpi.toFixed(2)})`);
  });

  test('Functional simulation: PDF.js render cancellation exception handling', async () => {
    const pdfData = getSinglePageA4Pdf();
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useSystemFonts: true,
      isEvalSupported: false,
    });
    const doc = await loadingTask.promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 150 / 72 });

    // Mock canvas 2D context
    const mockContext = {
      save: () => {},
      restore: () => {},
      transform: () => {},
      beginPath: () => {},
      closePath: () => {},
      fill: () => {},
      stroke: () => {},
      clip: () => {},
      rect: () => {},
      clearRect: () => {},
      drawImage: () => {},
      canvas: { width: Math.floor(viewport.width), height: Math.floor(viewport.height) },
    };

    const renderTask = page.render({
      canvasContext: mockContext,
      viewport,
    });

    // Immediately cancel task
    renderTask.cancel();

    await assert.rejects(
      async () => {
        await renderTask.promise;
      },
      (err) => {
        assert.ok(err, 'Cancelled task must reject');
        assert.equal(err.name, 'RenderingCancelledException', 'Must reject with RenderingCancelledException');
        return true;
      }
    );
  });
});
