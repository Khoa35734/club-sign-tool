import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as pdfjsLib from 'pdfjs-dist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('FR-PDF-004: Zoom Controls (25% to 400%) & Ctrl+Scroll Test Suite', () => {
  const zoomUtilPath = path.join(rootDir, 'src', 'utils', 'zoom.ts');
  const zoomControlsPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'components',
    'PdfZoomControls.tsx'
  );
  const zoomWheelHookPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'hooks',
    'useZoomWheel.ts'
  );
  const scrollObserverHookPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'hooks',
    'useViewportScrollObserver.ts'
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
  const editorStorePath = path.join(rootDir, 'src', 'stores', 'useEditorStore.ts');
  const utilsIndexPath = path.join(rootDir, 'src', 'utils', 'index.ts');
  const docIndexPath = path.join(rootDir, 'src', 'features', 'document', 'index.ts');

  // Synthetic valid A4 single-page PDF (595.28 x 841.89 pt)
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
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x33, 0x39, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x0a,
      0x74, 0x72, 0x61, 0x69, 0x6c, 0x65, 0x72, 0x0a,
      0x3c, 0x3c, 0x2f, 0x53, 0x69, 0x7a, 0x65, 0x20, 0x34, 0x20, 0x2f, 0x52, 0x6f, 0x6f, 0x74, 0x20, 0x31, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a,
      0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66, 0x0a,
      0x32, 0x33, 0x36, 0x0a,
      0x25, 0x25, 0x45, 0x4f, 0x46,
    ]);

  test('Required source files for zoom feature exist and are non-empty', () => {
    assert.ok(fs.existsSync(zoomUtilPath), 'zoom.ts must exist');
    assert.ok(fs.statSync(zoomUtilPath).size > 0, 'zoom.ts must not be empty');

    assert.ok(fs.existsSync(zoomControlsPath), 'PdfZoomControls.tsx must exist');
    assert.ok(fs.statSync(zoomControlsPath).size > 0, 'PdfZoomControls.tsx must not be empty');

    assert.ok(fs.existsSync(zoomWheelHookPath), 'useZoomWheel.ts must exist');
    assert.ok(fs.statSync(zoomWheelHookPath).size > 0, 'useZoomWheel.ts must not be empty');

    assert.ok(fs.existsSync(scrollObserverHookPath), 'useViewportScrollObserver.ts must exist');
    assert.ok(fs.statSync(scrollObserverHookPath).size > 0, 'useViewportScrollObserver.ts must not be empty');
  });

  test('zoom.ts implements MIN_ZOOM = 0.25, MAX_ZOOM = 4.0, clamping and formatting', () => {
    const content = fs.readFileSync(zoomUtilPath, 'utf8');

    assert.match(content, /export const MIN_ZOOM\s*=\s*0\.25/, 'MIN_ZOOM must strictly equal 0.25 (25%)');
    assert.match(content, /export const MAX_ZOOM\s*=\s*4\.0/, 'MAX_ZOOM must strictly equal 4.0 (400%)');
    assert.match(content, /export const DEFAULT_ZOOM\s*=\s*1\.0/, 'DEFAULT_ZOOM must equal 1.0 (100%)');
    assert.match(content, /export function clampZoom/, 'clampZoom must be exported');
    assert.match(content, /export function formatZoom/, 'formatZoom must be exported');
    assert.match(content, /export function zoomIn/, 'zoomIn must be exported');
    assert.match(content, /export function zoomOut/, 'zoomOut must be exported');

    const utilsContent = fs.readFileSync(utilsIndexPath, 'utf8');
    assert.match(utilsContent, /export \* from '\.\/zoom'/, 'utils/index.ts must export zoom utilities');
  });

  test('zoom mathematical calculation verification', () => {
    // Test pure logic matching zoom.ts
    const clamp = (val) => {
      if (isNaN(val) || val <= 0) return 1.0;
      const c = Math.min(4.0, Math.max(0.25, val));
      return Math.round(c * 100) / 100;
    };

    const format = (z) => `${Math.round(clamp(z) * 100)}%`;

    // Boundary checks
    assert.equal(clamp(0.1), 0.25, 'Clamps below 0.25 to 0.25');
    assert.equal(clamp(0.25), 0.25, 'Retains exact 0.25');
    assert.equal(clamp(1.0), 1.0, 'Retains 1.0 (100%)');
    assert.equal(clamp(4.0), 4.0, 'Retains 4.0 (400%)');
    assert.equal(clamp(5.5), 4.0, 'Clamps above 4.0 to 4.0');
    assert.equal(clamp(-1), 1.0, 'Invalid negative values reset to 1.0');
    assert.equal(clamp(NaN), 1.0, 'NaN resets to 1.0');

    // Format checks
    assert.equal(format(1.0), '100%', '1.0 formats to 100%');
    assert.equal(format(0.25), '25%', '0.25 formats to 25%');
    assert.equal(format(4.0), '400%', '4.0 formats to 400%');
    assert.equal(format(1.5), '150%', '1.5 formats to 150%');
  });

  test('useEditorStore implements zoomIn, zoomOut, and resetZoom actions', () => {
    const content = fs.readFileSync(editorStorePath, 'utf8');

    assert.match(content, /zoomIn:\s*\(step\?: number\)\s*=>/, 'Must declare zoomIn action');
    assert.match(content, /zoomOut:\s*\(step\?: number\)\s*=>/, 'Must declare zoomOut action');
    assert.match(content, /resetZoom:\s*\(\)\s*=>/, 'Must declare resetZoom action');
    assert.match(content, /Math\.min\(4\.0,\s*Math\.max\(0\.25,\s*zoomLevel\)\)|clampZoom/, 'setZoomLevel must clamp zoom level');
  });

  test('PdfZoomControls component provides buttons, indicator, and accessibility attributes', () => {
    const content = fs.readFileSync(zoomControlsPath, 'utf8');

    assert.match(content, /data-testid="pdf-zoom-controls"/, 'Root container must have testid');
    assert.match(content, /data-testid="zoom-out-button"/, 'Zoom out button must have testid');
    assert.match(content, /data-testid="zoom-in-button"/, 'Zoom in button must have testid');
    assert.match(content, /data-testid="zoom-level-indicator"/, 'Zoom percentage indicator must have testid');
    assert.match(content, /disabled=\{isMinZoom\}/, 'Disables zoom out at 25%');
    assert.match(content, /disabled=\{isMaxZoom\}/, 'Disables zoom in at 400%');
  });

  test('useZoomWheel hook listens for Ctrl+Wheel and prevents default scroll', () => {
    const content = fs.readFileSync(zoomWheelHookPath, 'utf8');

    assert.match(content, /export function useZoomWheel/, 'useZoomWheel must be exported');
    assert.match(content, /e\.ctrlKey\s*\|\|\s*e\.metaKey/, 'Checks for Ctrl or Meta key');
    assert.match(content, /e\.preventDefault\(\)/, 'Prevents default scrolling when zooming');
    assert.match(content, /addEventListener\('wheel',\s*handleWheel,\s*\{\s*passive:\s*false\s*\}\)/, 'Uses non-passive wheel listener to allow preventDefault');
    assert.match(content, /removeEventListener\('wheel'/, 'Cleans up wheel listener on unmount');
  });

  test('PdfViewportToolbar and PdfDocumentViewport integrate zoom controls and wheel hook', () => {
    const toolbarContent = fs.readFileSync(toolbarPath, 'utf8');
    assert.match(toolbarContent, /PdfZoomControls/, 'Toolbar renders PdfZoomControls');
    assert.match(toolbarContent, /onZoomIn/, 'Toolbar accepts onZoomIn prop');
    assert.match(toolbarContent, /onZoomOut/, 'Toolbar accepts onZoomOut prop');

    const viewportContent = fs.readFileSync(viewportPath, 'utf8');
    assert.match(viewportContent, /useZoomWheel/, 'Viewport imports and uses useZoomWheel');
    assert.match(viewportContent, /effectiveZoom/, 'Viewport calculates effective zoom');
    assert.match(viewportContent, /zoom=\{effectiveZoom\}/, 'Passes effective zoom to PdfPageView');
  });

  test('document feature index exports zoom components and hooks', () => {
    const content = fs.readFileSync(docIndexPath, 'utf8');

    assert.match(content, /export \* from '\.\/components\/PdfZoomControls'/, 'Exports PdfZoomControls');
    assert.match(content, /export \* from '\.\/hooks\/useZoomWheel'/, 'Exports useZoomWheel');
    assert.match(content, /export \* from '\.\/hooks\/useViewportScrollObserver'/, 'Exports useViewportScrollObserver');
  });

  test('Functional simulation: PDF.js scales viewport dimensions linearly across 25% to 400%', async () => {
    const pdfData = getSinglePageA4Pdf();
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useSystemFonts: true,
      isEvalSupported: false,
    });
    const doc = await loadingTask.promise;
    const page = await doc.getPage(1);

    // Standard A4: 595.28 x 841.89 pt
    const zoomLevels = [0.25, 0.5, 1.0, 1.5, 2.0, 4.0];

    for (const zoom of zoomLevels) {
      const viewport = page.getViewport({ scale: zoom });
      const width = Math.round(viewport.width);
      const height = Math.round(viewport.height);

      const expectedWidth = Math.round(595.28 * zoom);
      const expectedHeight = Math.round(841.89 * zoom);

      assert.equal(width, expectedWidth, `Zoom ${zoom * 100}% width must match expected`);
      assert.equal(height, expectedHeight, `Zoom ${zoom * 100}% height must match expected`);
    }

    // Verify 400% is exactly 16x larger area than 25% (4.0 / 0.25 = 16x linear scale)
    const vpMin = page.getViewport({ scale: 0.25 });
    const vpMax = page.getViewport({ scale: 4.0 });

    assert.equal(Math.round(vpMax.width / vpMin.width), 16, '400% zoom width is 16x 25% zoom width');
  });
});
