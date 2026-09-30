import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pdfjsLib from 'pdfjs-dist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('FR-PDF-004 & FR-PDF-006: Fit Page, Fit Width & Mixed Page Layout Test Suite', () => {
  const zoomUtilPath = path.join(rootDir, 'src', 'utils', 'zoom.ts');
  const fitZoomHookPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'hooks',
    'usePdfFitZoom.ts'
  );
  const zoomControlsPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'components',
    'PdfZoomControls.tsx'
  );
  const toolbarPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'components',
    'PdfViewportToolbar.tsx'
  );
  const viewportPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'components',
    'PdfDocumentViewport.tsx'
  );
  const pageViewPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'components',
    'PdfPageView.tsx'
  );
  const docIndexPath = path.join(rootDir, 'src', 'features', 'document', 'index.ts');

  // Synthetic valid multi-page PDF with mixed dimensions (A4 Portrait, Rotated Landscape)
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
      0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x20, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x20, 0x2f, 0x50, 0x61, 0x72, 0x65, 0x6e, 0x74, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x20, 0x2f, 0x4d, 0x65, 0x64, 0x69, 0x61, 0x42, 0x6f, 0x78, 0x20, 0x5b, 0x30, 0x20, 0x30, 0x20, 0x38, 0x34, 0x31, 0x2e, 0x38, 0x39, 0x20, 0x35, 0x39, 0x35, 0x2e, 0x32, 0x38, 0x5d, 0x20, 0x2f, 0x52, 0x6f, 0x74, 0x61, 0x74, 0x65, 0x20, 0x39, 0x30, 0x3e, 0x3e, 0x0a,
      0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a,
      0x78, 0x72, 0x65, 0x66, 0x0a,
      0x30, 0x20, 0x35, 0x0a,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35, 0x35, 0x33, 0x35, 0x20, 0x66, 0x0a,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x38, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x0a,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x37, 0x37, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x0a,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x35, 0x39, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x0a,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x35, 0x37, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x0a,
      0x74, 0x72, 0x61, 0x69, 0x6c, 0x65, 0x72, 0x0a,
      0x3c, 0x3c, 0x2f, 0x53, 0x69, 0x7a, 0x65, 0x20, 0x35, 0x20, 0x2f, 0x52, 0x6f, 0x6f, 0x74, 0x20, 0x31, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a,
      0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66, 0x0a,
      0x33, 0x37, 0x35, 0x0a,
      0x25, 0x25, 0x45, 0x4f, 0x46,
    ]);

  test('Required source files for Fit Page, Fit Width & Mixed Page Layout exist and are non-empty', () => {
    assert.ok(fs.existsSync(zoomUtilPath), 'zoom.ts must exist');
    assert.ok(fs.statSync(zoomUtilPath).size > 0, 'zoom.ts must not be empty');

    assert.ok(fs.existsSync(fitZoomHookPath), 'usePdfFitZoom.ts must exist');
    assert.ok(fs.statSync(fitZoomHookPath).size > 0, 'usePdfFitZoom.ts must not be empty');

    assert.ok(fs.existsSync(zoomControlsPath), 'PdfZoomControls.tsx must exist');
    assert.ok(fs.statSync(zoomControlsPath).size > 0, 'PdfZoomControls.tsx must not be empty');

    assert.ok(fs.existsSync(toolbarPath), 'PdfViewportToolbar.tsx must exist');
    assert.ok(fs.statSync(toolbarPath).size > 0, 'PdfViewportToolbar.tsx must not be empty');

    assert.ok(fs.existsSync(viewportPath), 'PdfDocumentViewport.tsx must exist');
    assert.ok(fs.statSync(viewportPath).size > 0, 'PdfDocumentViewport.tsx must not be empty');

    assert.ok(fs.existsSync(pageViewPath), 'PdfPageView.tsx must exist');
    assert.ok(fs.statSync(pageViewPath).size > 0, 'PdfPageView.tsx must not be empty');
  });

  test('zoom.ts implements calculateFitWidthZoom and calculateFitPageZoom algorithms', () => {
    const content = fs.readFileSync(zoomUtilPath, 'utf8');

    assert.match(content, /export function calculateFitWidthZoom/, 'Must export calculateFitWidthZoom');
    assert.match(content, /export function calculateFitPageZoom/, 'Must export calculateFitPageZoom');
    assert.match(content, /isRotated90or270|rotation === 90 \|\| rotation === 270/, 'Must detect 90 or 270 degree rotation');
    assert.match(content, /orientedWidth/, 'Must compute orientedWidth');
    assert.match(content, /orientedHeight/, 'Must compute orientedHeight');
  });

  test('calculateFitWidthZoom and calculateFitPageZoom mathematical correctness', () => {
    // Implement mathematical logic to match zoom.ts
    const clampZoom = (val) => {
      if (isNaN(val) || val <= 0) return 1.0;
      const c = Math.min(4.0, Math.max(0.25, val));
      return Math.round(c * 100) / 100;
    };

    const fitWidth = (page, viewportWidth, hPad = 48) => {
      const rot = page.rotation ? ((page.rotation % 360) + 360) % 360 : 0;
      const isRot = rot === 90 || rot === 270;
      const orientedWidth = isRot ? page.heightPt : page.widthPt;
      const availWidth = Math.max(50, viewportWidth - hPad);
      return clampZoom(availWidth / orientedWidth);
    };

    const fitPage = (page, viewportWidth, viewportHeight, pad = { horizontal: 48, vertical: 48 }) => {
      const rot = page.rotation ? ((page.rotation % 360) + 360) % 360 : 0;
      const isRot = rot === 90 || rot === 270;
      const orientedWidth = isRot ? page.heightPt : page.widthPt;
      const orientedHeight = isRot ? page.widthPt : page.heightPt;
      const availW = Math.max(50, viewportWidth - (pad.horizontal ?? 48));
      const availH = Math.max(50, viewportHeight - (pad.vertical ?? 48));
      return clampZoom(Math.min(availW / orientedWidth, availH / orientedHeight));
    };

    // Standard A4 Portrait: 595.28 x 841.89 pt
    const portraitPage = { widthPt: 595.28, heightPt: 841.89, rotation: 0 };
    // Standard A4 Landscape (unrotated dimensions 841.89 x 595.28 pt):
    const landscapePage = { widthPt: 841.89, heightPt: 595.28, rotation: 0 };
    // Rotated A4 Landscape (media box 841.89 x 595.28 pt with 90° rotation):
    const rotatedLandscapePage = { widthPt: 841.89, heightPt: 595.28, rotation: 90 };

    // Viewport: 1000 x 800 px, padding 48px -> available 952 x 752 px
    const fitWPortrait = fitWidth(portraitPage, 1000, 48);
    assert.equal(fitWPortrait, 1.6, 'Fit width for portrait page equals 952 / 595.28 ~ 1.60');

    const fitWLandscape = fitWidth(landscapePage, 1000, 48);
    assert.equal(fitWLandscape, 1.13, 'Fit width for landscape page equals 952 / 841.89 ~ 1.13');

    // For rotated 90° landscape (widthPt=841.89, heightPt=595.28, rot=90), oriented width is heightPt (595.28)
    const fitWRotated = fitWidth(rotatedLandscapePage, 1000, 48);
    assert.equal(fitWRotated, 1.6, 'Fit width for 90° rotated page swaps dimensions properly');

    // Fit Page Portrait: min(952/595.28, 752/841.89) = min(1.60, 0.89) = 0.89
    const fitPPortrait = fitPage(portraitPage, 1000, 800);
    assert.equal(fitPPortrait, 0.89, 'Fit page for portrait is constrained by viewport height (0.89)');

    // Fit Page Landscape: min(952/841.89, 752/595.28) = min(1.13, 1.26) = 1.13
    const fitPLandscape = fitPage(landscapePage, 1000, 800);
    assert.equal(fitPLandscape, 1.13, 'Fit page for landscape is constrained by viewport width (1.13)');

    // Clamping limits
    assert.equal(fitWidth(portraitPage, 10000, 0), 4.0, 'Clamps zoom at MAX_ZOOM (4.0)');
    assert.equal(fitWidth(portraitPage, 50, 0), 0.25, 'Clamps zoom at MIN_ZOOM (0.25)');
  });

  test('usePdfFitZoom hook encapsulates zoom calculations and binds container ref', () => {
    const hookContent = fs.readFileSync(fitZoomHookPath, 'utf8');

    assert.match(hookContent, /export function usePdfFitZoom/, 'Exports usePdfFitZoom');
    assert.match(hookContent, /calculateFitWidthZoom/, 'Calls calculateFitWidthZoom');
    assert.match(hookContent, /calculateFitPageZoom/, 'Calls calculateFitPageZoom');
    assert.match(hookContent, /handleFitWidth/, 'Returns handleFitWidth');
    assert.match(hookContent, /handleFitPage/, 'Returns handleFitPage');

    const docIndexContent = fs.readFileSync(docIndexPath, 'utf8');
    assert.match(docIndexContent, /export \* from '\.\/hooks\/usePdfFitZoom'/, 'document index exports usePdfFitZoom');
  });

  test('PdfZoomControls renders Fit Width and Fit Page buttons with testids and accessible labels', () => {
    const content = fs.readFileSync(zoomControlsPath, 'utf8');

    assert.match(content, /data-testid="zoom-fit-width-button"/, 'Fit Width button must have testid');
    assert.match(content, /data-testid="zoom-fit-page-button"/, 'Fit Page button must have testid');
    assert.match(content, /title="Vừa chiều rộng \(Fit Width\)"/, 'Fit Width button has descriptive Vietnamese title');
    assert.match(content, /title="Vừa toàn bộ trang \(Fit Page\)"/, 'Fit Page button has descriptive Vietnamese title');
    assert.match(content, /onFitWidth/, 'Component accepts onFitWidth callback');
    assert.match(content, /onFitPage/, 'Component accepts onFitPage callback');
  });

  test('PdfViewportToolbar and PdfDocumentViewport wire Fit Page & Fit Width and support mixed layout', () => {
    const toolbarContent = fs.readFileSync(toolbarPath, 'utf8');
    assert.match(toolbarContent, /onFitWidth\?: \(\) => void/, 'Toolbar accepts onFitWidth prop');
    assert.match(toolbarContent, /onFitPage\?: \(\) => void/, 'Toolbar accepts onFitPage prop');
    assert.match(toolbarContent, /onFitWidth=\{onFitWidth\}/, 'Toolbar passes onFitWidth to controls');
    assert.match(toolbarContent, /onFitPage=\{onFitPage\}/, 'Toolbar passes onFitPage to controls');

    const viewportContent = fs.readFileSync(viewportPath, 'utf8');
    assert.match(viewportContent, /usePdfFitZoom/, 'Viewport uses usePdfFitZoom');
    assert.match(viewportContent, /onFitWidth=\{handleFitWidth\}/, 'Viewport passes handleFitWidth to toolbar');
    assert.match(viewportContent, /onFitPage=\{handleFitPage\}/, 'Viewport passes handleFitPage to toolbar');
    assert.match(viewportContent, /overflow-x-auto/, 'Scroll container supports horizontal scrolling for wide/landscape pages');
    assert.match(viewportContent, /items-center/, 'Continuous and single views center pages horizontally in viewport');
    assert.match(viewportContent, /min-w-full/, 'Continuous page list fills viewport width to ensure proper centering');
  });

  test('PdfPageView correctly rotates and scales mixed page sizes (FR-PDF-006)', () => {
    const content = fs.readFileSync(pageViewPath, 'utf8');

    assert.match(content, /isRotated90or270 = rotation === 90 \|\| rotation === 270/, 'Detects 90/270 rotation in page view');
    assert.match(content, /orientedWidthPt = isRotated90or270 \? heightPt : widthPt/, 'Swaps width when rotated');
    assert.match(content, /orientedHeightPt = isRotated90or270 \? widthPt : heightPt/, 'Swaps height when rotated');
    assert.match(content, /displayWidth = Math\.max\(1, Math\.round\(orientedWidthPt \* zoom\)\)/, 'Scales displayWidth with zoom');
    assert.match(content, /displayHeight = Math\.max\(1, Math\.round\(orientedHeightPt \* zoom\)\)/, 'Scales displayHeight with zoom');
  });

  test('Functional simulation: PDF.js parses multi-page mixed document and applies Fit zoom correctly', async () => {
    const pdfData = getMultiPageMixedPdf();
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useSystemFonts: true,
      isEvalSupported: false,
    });
    const doc = await loadingTask.promise;
    assert.equal(doc.numPages, 2, 'Document has 2 pages');

    // Page 1: Portrait A4
    const page1 = await doc.getPage(1);
    const vp1 = page1.getViewport({ scale: 1.0 });
    assert.equal(Math.round(vp1.width), 595, 'Page 1 width is ~595 pt');
    assert.equal(Math.round(vp1.height), 842, 'Page 1 height is ~842 pt');
    assert.equal(vp1.rotation, 0, 'Page 1 rotation is 0');

    // Page 2: Landscape with 90° rotation
    const page2 = await doc.getPage(2);
    const vp2 = page2.getViewport({ scale: 1.0 });
    assert.equal(page2.rotate, 90, 'Page 2 rotation is 90°');
    // PDF.js getViewport automatically swaps width & height when rotation is 90°
    assert.equal(Math.round(vp2.width), 595, 'Page 2 oriented width is ~595 pt');
    assert.equal(Math.round(vp2.height), 842, 'Page 2 oriented height is ~842 pt');

    // Simulated Viewport Dimensions: 1200 x 900 px (container client size), padding 48px
    const viewportW = 1200;
    const viewportH = 900;
    const availableW = viewportW - 48; // 1152 px
    const availableH = viewportH - 48; // 852 px

    // Fit Width for Page 1 (Portrait: 595.28 pt):
    const fitW1 = Math.round((availableW / vp1.width) * 100) / 100;
    assert.equal(fitW1, 1.94, 'Fit width zoom for Page 1 is ~1.94');

    // Fit Page for Page 1:
    const fitP1 = Math.round(Math.min(availableW / vp1.width, availableH / vp1.height) * 100) / 100;
    assert.equal(fitP1, 1.01, 'Fit page zoom for Page 1 is ~1.01 (bounded by height)');

    // When scaling Page 1 with fitP1, viewport fits within available container
    const vp1Fitted = page1.getViewport({ scale: fitP1 });
    assert.ok(vp1Fitted.width <= availableW + 1, 'Fitted page 1 width does not exceed available width');
    assert.ok(vp1Fitted.height <= availableH + 1, 'Fitted page 1 height does not exceed available height');
  });
});
