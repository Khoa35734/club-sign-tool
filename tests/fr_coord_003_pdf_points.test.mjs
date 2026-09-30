import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('FR-COORD-003: Native PDF Points Coordinate Conversion Test Suite', () => {
  const coordinatesUtilPath = path.join(rootDir, 'src', 'utils', 'coordinates.ts');
  const editorTypesPath = path.join(rootDir, 'src', 'types', 'editor.ts');
  const canvasTypesPath = path.join(rootDir, 'src', 'types', 'canvas.ts');

  test('Module exports verification for Native PDF Points types and conversion utilities', async () => {
    assert.ok(fs.existsSync(coordinatesUtilPath), 'src/utils/coordinates.ts must exist');
    assert.ok(fs.existsSync(editorTypesPath), 'src/types/editor.ts must exist');
    assert.ok(fs.existsSync(canvasTypesPath), 'src/types/canvas.ts must exist');

    const mod = await import('../src/utils/coordinates.ts');
    assert.strictEqual(typeof mod.normalizedToPdfPoints, 'function', 'normalizedToPdfPoints must be a function');
    assert.strictEqual(typeof mod.pdfPointsToNormalized, 'function', 'pdfPointsToNormalized must be a function');
    assert.strictEqual(typeof mod.normalizedPointToPdfPoint, 'function', 'normalizedPointToPdfPoint must be a function');
    assert.strictEqual(typeof mod.pdfPointToNormalizedPoint, 'function', 'pdfPointToNormalizedPoint must be a function');

    const editorSource = fs.readFileSync(editorTypesPath, 'utf8');
    assert.match(editorSource, /export interface PdfPointCoordinates/, 'editor.ts must export PdfPointCoordinates');
    assert.match(editorSource, /export interface PdfPoint/, 'editor.ts must export PdfPoint');
    assert.match(editorSource, /export type PdfPageDimensionsInput/, 'editor.ts must export PdfPageDimensionsInput');

    const canvasSource = fs.readFileSync(canvasTypesPath, 'utf8');
    assert.match(canvasSource, /PdfPointCoordinates/, 'canvas.ts must re-export PdfPointCoordinates');
    assert.match(canvasSource, /PdfPoint/, 'canvas.ts must re-export PdfPoint');
    assert.match(canvasSource, /PdfPageDimensionsInput/, 'canvas.ts must re-export PdfPageDimensionsInput');
  });

  test('Mathematical correctness and bottom-left origin mapping according to SRS Section 13.2', async () => {
    const { normalizedToPdfPoints, pdfPointsToNormalized } = await import('../src/utils/coordinates.ts');

    const pageWidthPt = 600;
    const pageHeightPt = 800;

    // Case 1: Object at top-left corner (y_norm = 0)
    // Normalized: x=0, y=0, w=0.2, h=0.1
    // Expected PDF (bottom-left origin):
    // x = 0 * 600 = 0
    // y = (1.0 - 0.0 - 0.1) * 800 = 0.9 * 800 = 720
    // width = 0.2 * 600 = 120
    // height = 0.1 * 800 = 80
    // Notice top edge in PDF is y + height = 720 + 80 = 800 (touches page top)
    const topLeftNormalized = { x: 0.0, y: 0.0, width: 0.2, height: 0.1 };
    const topLeftPdf = normalizedToPdfPoints(topLeftNormalized, pageWidthPt, pageHeightPt);
    assert.strictEqual(topLeftPdf.x, 0);
    assert.strictEqual(topLeftPdf.y, 720);
    assert.strictEqual(topLeftPdf.width, 120);
    assert.strictEqual(topLeftPdf.height, 80);

    // Case 2: Object at bottom-left corner (y_norm + h_norm = 1.0)
    // Normalized: x=0, y=0.9, w=0.2, h=0.1
    // Expected PDF:
    // x = 0
    // y = (1.0 - 0.9 - 0.1) * 800 = 0.0 (touches page bottom)
    // width = 120, height = 80
    const bottomLeftNormalized = { x: 0.0, y: 0.9, width: 0.2, height: 0.1 };
    const bottomLeftPdf = normalizedToPdfPoints(bottomLeftNormalized, pageWidthPt, pageHeightPt);
    assert.strictEqual(bottomLeftPdf.x, 0);
    assert.strictEqual(bottomLeftPdf.y, 0);
    assert.strictEqual(bottomLeftPdf.width, 120);
    assert.strictEqual(bottomLeftPdf.height, 80);

    // Backward conversion verification
    const roundTripTopLeft = pdfPointsToNormalized(topLeftPdf, pageWidthPt, pageHeightPt);
    assert.deepStrictEqual(roundTripTopLeft, topLeftNormalized);

    const roundTripBottomLeft = pdfPointsToNormalized(bottomLeftPdf, pageWidthPt, pageHeightPt);
    assert.deepStrictEqual(roundTripBottomLeft, bottomLeftNormalized);
  });

  test('PORTRAIT orientation: conversions and perfect round-trip fidelity across standard paper sizes', async () => {
    const { normalizedToPdfPoints, pdfPointsToNormalized } = await import('../src/utils/coordinates.ts');

    const portraitPages = [
      { name: 'A4 Portrait', widthPt: 595.28, heightPt: 841.89 },
      { name: 'US Letter Portrait', widthPt: 612.0, heightPt: 792.0 },
      { name: 'US Legal Portrait', widthPt: 612.0, heightPt: 1008.0 },
      { name: 'A3 Portrait', widthPt: 841.89, heightPt: 1190.55 },
    ];

    const placements = [
      { name: 'Header Title / Department Stamp', coords: { x: 0.08, y: 0.05, width: 0.35, height: 0.08 } },
      { name: 'Center Body Annotation', coords: { x: 0.25, y: 0.45, width: 0.50, height: 0.15 } },
      { name: 'Leader Visual Signature (Bottom-Right)', coords: { x: 0.6254, y: 0.7812, width: 0.2215, height: 0.0850 } },
      { name: 'Club Official Stamp (1/3 overlap)', coords: { x: 0.5840, y: 0.7650, width: 0.1650, height: 0.1650 } },
      { name: 'Date Text Field', coords: { x: 0.60, y: 0.72, width: 0.30, height: 0.035 } },
    ];

    for (const page of portraitPages) {
      for (const { name, coords } of placements) {
        // Forward: normalized -> pdfPoints
        const pdfCoords = normalizedToPdfPoints(coords, page);

        // Sanity checks on PDF points
        assert.ok(pdfCoords.x >= 0, `${page.name} ${name}: pdfX must be >= 0`);
        assert.ok(pdfCoords.y >= 0, `${page.name} ${name}: pdfY must be >= 0`);
        assert.ok(pdfCoords.x + pdfCoords.width <= page.widthPt + 1e-4, `${page.name} ${name}: right edge within page`);
        assert.ok(pdfCoords.y + pdfCoords.height <= page.heightPt + 1e-4, `${page.name} ${name}: top edge within page`);

        // Backward: pdfPoints -> normalized
        const recovered = pdfPointsToNormalized(pdfCoords, page);

        assert.strictEqual(
          recovered.x,
          coords.x,
          `${page.name} ${name}: x mismatch after round-trip (got ${recovered.x}, expected ${coords.x})`
        );
        assert.strictEqual(
          recovered.y,
          coords.y,
          `${page.name} ${name}: y mismatch after round-trip (got ${recovered.y}, expected ${coords.y})`
        );
        assert.strictEqual(
          recovered.width,
          coords.width,
          `${page.name} ${name}: width mismatch after round-trip`
        );
        assert.strictEqual(
          recovered.height,
          coords.height,
          `${page.name} ${name}: height mismatch after round-trip`
        );
      }
    }
  });

  test('LANDSCAPE orientation: conversions and perfect round-trip fidelity across standard paper sizes', async () => {
    const { normalizedToPdfPoints, pdfPointsToNormalized } = await import('../src/utils/coordinates.ts');

    const landscapePages = [
      { name: 'A4 Landscape', widthPt: 841.89, heightPt: 595.28 },
      { name: 'US Letter Landscape', widthPt: 792.0, heightPt: 612.0 },
      { name: 'A3 Landscape', widthPt: 1190.55, heightPt: 841.89 },
    ];

    const placements = [
      { name: 'Left Column Club Seal', coords: { x: 0.10, y: 0.70, width: 0.15, height: 0.20 } },
      { name: 'Wide Landscape Header', coords: { x: 0.15, y: 0.05, width: 0.70, height: 0.10 } },
      { name: 'Secretary Signature (Col 1)', coords: { x: 0.20, y: 0.75, width: 0.20, height: 0.12 } },
      { name: 'President Signature (Col 2)', coords: { x: 0.70, y: 0.75, width: 0.20, height: 0.12 } },
      { name: 'Administrative Stamp (Col 2 Overlap)', coords: { x: 0.65, y: 0.73, width: 0.14, height: 0.14 } },
    ];

    for (const page of landscapePages) {
      for (const { name, coords } of placements) {
        // Forward: normalized -> pdfPoints
        const pdfCoords = normalizedToPdfPoints(coords, page);

        // Sanity checks on PDF points
        assert.ok(pdfCoords.x >= 0, `${page.name} ${name}: pdfX must be >= 0`);
        assert.ok(pdfCoords.y >= 0, `${page.name} ${name}: pdfY must be >= 0`);
        assert.ok(pdfCoords.x + pdfCoords.width <= page.widthPt + 1e-4, `${page.name} ${name}: right edge within page`);
        assert.ok(pdfCoords.y + pdfCoords.height <= page.heightPt + 1e-4, `${page.name} ${name}: top edge within page`);

        // Backward: pdfPoints -> normalized
        const recovered = pdfPointsToNormalized(pdfCoords, page);

        assert.strictEqual(
          recovered.x,
          coords.x,
          `${page.name} ${name}: x mismatch after round-trip (got ${recovered.x}, expected ${coords.x})`
        );
        assert.strictEqual(
          recovered.y,
          coords.y,
          `${page.name} ${name}: y mismatch after round-trip (got ${recovered.y}, expected ${coords.y})`
        );
        assert.strictEqual(
          recovered.width,
          coords.width,
          `${page.name} ${name}: width mismatch after round-trip`
        );
        assert.strictEqual(
          recovered.height,
          coords.height,
          `${page.name} ${name}: height mismatch after round-trip`
        );
      }
    }
  });

  test('Polymorphic page dimension input overloads produce identical results', async () => {
    const { normalizedToPdfPoints, pdfPointsToNormalized } = await import('../src/utils/coordinates.ts');

    const widthPt = 595.28;
    const heightPt = 841.89;
    const coords = { x: 0.25, y: 0.35, width: 0.40, height: 0.20 };

    // 1. Scalar arguments (widthPt, heightPt)
    const result1 = normalizedToPdfPoints(coords, widthPt, heightPt);

    // 2. Object with { widthPt, heightPt }
    const result2 = normalizedToPdfPoints(coords, { widthPt, heightPt });

    // 3. Object with { width, height }
    const result3 = normalizedToPdfPoints(coords, { width: widthPt, height: heightPt });

    assert.deepStrictEqual(result1, result2, 'scalar and { widthPt, heightPt } must match');
    assert.deepStrictEqual(result1, result3, 'scalar and { width, height } must match');

    // Test reverse overloads
    const norm1 = pdfPointsToNormalized(result1, widthPt, heightPt);
    const norm2 = pdfPointsToNormalized(result1, { widthPt, heightPt });
    const norm3 = pdfPointsToNormalized(result1, { width: widthPt, height: heightPt });

    assert.deepStrictEqual(norm1, norm2, 'reverse scalar and { widthPt, heightPt } must match');
    assert.deepStrictEqual(norm1, norm3, 'reverse scalar and { width, height } must match');
  });

  test('Single point conversions (normalizedPointToPdfPoint & pdfPointToNormalizedPoint)', async () => {
    const { normalizedPointToPdfPoint, pdfPointToNormalizedPoint } = await import('../src/utils/coordinates.ts');

    const widthPt = 800;
    const heightPt = 1000;

    // Top-left: (0, 0) -> (0, 1000)
    const ptTopLeft = normalizedPointToPdfPoint({ x: 0.0, y: 0.0 }, widthPt, heightPt);
    assert.deepStrictEqual(ptTopLeft, { x: 0, y: 1000 });
    assert.deepStrictEqual(pdfPointToNormalizedPoint(ptTopLeft, widthPt, heightPt), { x: 0.0, y: 0.0 });

    // Bottom-left: (0, 1.0) -> (0, 0)
    const ptBottomLeft = normalizedPointToPdfPoint({ x: 0.0, y: 1.0 }, widthPt, heightPt);
    assert.deepStrictEqual(ptBottomLeft, { x: 0, y: 0 });
    assert.deepStrictEqual(pdfPointToNormalizedPoint(ptBottomLeft, widthPt, heightPt), { x: 0.0, y: 1.0 });

    // Center: (0.5, 0.5) -> (400, 500)
    const ptCenter = normalizedPointToPdfPoint({ x: 0.5, y: 0.5 }, widthPt, heightPt);
    assert.deepStrictEqual(ptCenter, { x: 400, y: 500 });
    assert.deepStrictEqual(pdfPointToNormalizedPoint(ptCenter, widthPt, heightPt), { x: 0.5, y: 0.5 });

    // Bottom-right: (1.0, 1.0) -> (800, 0)
    const ptBottomRight = normalizedPointToPdfPoint({ x: 1.0, y: 1.0 }, widthPt, heightPt);
    assert.deepStrictEqual(ptBottomRight, { x: 800, y: 0 });
    assert.deepStrictEqual(pdfPointToNormalizedPoint(ptBottomRight, widthPt, heightPt), { x: 1.0, y: 1.0 });

    // Top-right: (1.0, 0.0) -> (800, 1000)
    const ptTopRight = normalizedPointToPdfPoint({ x: 1.0, y: 0.0 }, widthPt, heightPt);
    assert.deepStrictEqual(ptTopRight, { x: 800, y: 1000 });
    assert.deepStrictEqual(pdfPointToNormalizedPoint(ptTopRight, widthPt, heightPt), { x: 1.0, y: 0.0 });
  });

  test('Edge cases: zero/negative dimensions, clamping, and raw rounding options', async () => {
    const {
      normalizedToPdfPoints,
      pdfPointsToNormalized,
      normalizedPointToPdfPoint,
      pdfPointToNormalizedPoint,
    } = await import('../src/utils/coordinates.ts');

    const sampleNorm = { x: 0.2, y: 0.3, width: 0.4, height: 0.1 };
    const samplePdf = { x: 100, y: 200, width: 150, height: 80 };

    // Zero / negative dimensions guard
    assert.deepStrictEqual(normalizedToPdfPoints(sampleNorm, 0, 800), { x: 0, y: 0, width: 0, height: 0 });
    assert.deepStrictEqual(normalizedToPdfPoints(sampleNorm, 600, -10), { x: 0, y: 0, width: 0, height: 0 });
    assert.deepStrictEqual(pdfPointsToNormalized(samplePdf, 0, 0), { x: 0, y: 0, width: 0, height: 0 });
    assert.deepStrictEqual(normalizedPointToPdfPoint({ x: 0.5, y: 0.5 }, 0, 500), { x: 0, y: 0 });
    assert.deepStrictEqual(pdfPointToNormalizedPoint({ x: 100, y: 200 }, -500, 500), { x: 0, y: 0 });

    // Clamping option
    const outOfBoundsPdf = { x: -50, y: -20, width: 800, height: 1200 };
    const clamped = pdfPointsToNormalized(outOfBoundsPdf, 500, 1000, { clamp: true });
    assert.ok(clamped.x >= 0.0 && clamped.x <= 1.0, 'clamped.x within [0, 1]');
    assert.ok(clamped.y >= 0.0 && clamped.y <= 1.0, 'clamped.y within [0, 1]');
    assert.ok(clamped.x + clamped.width <= 1.0, 'clamped right edge within 1.0');
    assert.ok(clamped.y + clamped.height <= 1.0, 'clamped bottom edge within 1.0');

    // Clamping on single point
    const clampedPt = pdfPointToNormalizedPoint({ x: -100, y: 2000 }, 500, 1000, { clamp: true });
    assert.strictEqual(clampedPt.x, 0.0);
    assert.strictEqual(clampedPt.y, 0.0); // 1.0 - 2000/1000 = -1.0 clamped to 0.0

    // Rounding option: round: false keeps high precision
    const unrounded = pdfPointsToNormalized({ x: 1, y: 1, width: 1, height: 1 }, 3, 7, { round: false });
    assert.strictEqual(unrounded.x, 1 / 3);
    assert.strictEqual(unrounded.width, 1 / 3);
    assert.strictEqual(unrounded.height, 1 / 7);
  });
});
