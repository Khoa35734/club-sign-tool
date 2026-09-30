import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('FR-COORD-002: Pure Coordinate Conversion Functions Test Suite', () => {
  const coordinatesUtilPath = path.join(rootDir, 'src', 'utils', 'coordinates.ts');

  test('src/utils/coordinates.ts exports normalizedToScreen, screenToNormalized, and point helpers', async () => {
    assert.ok(fs.existsSync(coordinatesUtilPath), 'src/utils/coordinates.ts must exist');

    const mod = await import('../src/utils/coordinates.ts');
    assert.strictEqual(typeof mod.normalizedToScreen, 'function', 'normalizedToScreen must be a function');
    assert.strictEqual(typeof mod.screenToNormalized, 'function', 'screenToNormalized must be a function');
    assert.strictEqual(typeof mod.normalizedPointToScreen, 'function', 'normalizedPointToScreen must be a function');
    assert.strictEqual(typeof mod.screenPointToNormalized, 'function', 'screenPointToNormalized must be a function');
  });

  test('Mathematical correctness of normalizedToScreen according to SRS Section 13.2', async () => {
    const { normalizedToScreen } = await import('../src/utils/coordinates.ts');

    const canonicalWidth = 595.28;
    const canonicalHeight = 841.89;

    const normalized = {
      x: 0.1,
      y: 0.2,
      width: 0.3,
      height: 0.4,
    };

    // 1. Calling with scalar width & height
    const screen1 = normalizedToScreen(normalized, canonicalWidth, canonicalHeight);
    assert.strictEqual(screen1.x, 0.1 * 595.28);
    assert.strictEqual(screen1.y, 0.2 * 841.89);
    assert.strictEqual(screen1.width, 0.3 * 595.28);
    assert.strictEqual(screen1.height, 0.4 * 841.89);

    // 2. Calling with RenderedPageDimensions object { width, height }
    const screen2 = normalizedToScreen(normalized, { width: canonicalWidth, height: canonicalHeight });
    assert.strictEqual(screen2.x, screen1.x);
    assert.strictEqual(screen2.y, screen1.y);
    assert.strictEqual(screen2.width, screen1.width);
    assert.strictEqual(screen2.height, screen1.height);

    // 3. Calling with { renderedWidth, renderedHeight }
    const screen3 = normalizedToScreen(normalized, { renderedWidth: canonicalWidth, renderedHeight: canonicalHeight });
    assert.strictEqual(screen3.x, screen1.x);
    assert.strictEqual(screen3.y, screen1.y);
  });

  test('Mathematical correctness of screenToNormalized according to SRS Section 13.2', async () => {
    const { screenToNormalized } = await import('../src/utils/coordinates.ts');

    const renderedWidth = 600;
    const renderedHeight = 900;

    const screen = {
      x: 150,
      y: 300,
      width: 200,
      height: 100,
    };

    const normalized = screenToNormalized(screen, renderedWidth, renderedHeight);
    assert.strictEqual(normalized.x, 0.25);
    assert.strictEqual(normalized.y, 1 / 3 ? Math.round((300 / 900) * 1e6) / 1e6 : 0.333333);
    assert.strictEqual(normalized.width, Math.round((200 / 600) * 1e6) / 1e6);
    assert.strictEqual(normalized.height, Math.round((100 / 900) * 1e6) / 1e6);
  });

  test('CRITICAL: Perfect round-trip conversion at 25%, 50%, 100%, 150%, 200%, and 300% zoom levels', async () => {
    const { normalizedToScreen, screenToNormalized } = await import('../src/utils/coordinates.ts');

    // Standard A4 dimensions in PDF points
    const canonicalWidth = 595.28;
    const canonicalHeight = 841.89;

    const zoomLevels = [0.25, 0.50, 1.00, 1.50, 2.00, 3.00];

    // Diverse set of realistic object placements
    const testCases = [
      { name: 'Top-left corner', coords: { x: 0.05, y: 0.05, width: 0.20, height: 0.10 } },
      { name: 'Center placement', coords: { x: 0.35, y: 0.40, width: 0.30, height: 0.20 } },
      { name: 'Signature bottom-right', coords: { x: 0.65, y: 0.80, width: 0.25, height: 0.12 } },
      { name: 'Stamp overlapping signature', coords: { x: 0.58, y: 0.78, width: 0.18, height: 0.18 } },
      { name: 'Small text label', coords: { x: 0.70, y: 0.75, width: 0.15, height: 0.03 } },
    ];

    for (const zoom of zoomLevels) {
      const renderedWidth = canonicalWidth * zoom;
      const renderedHeight = canonicalHeight * zoom;

      for (const { name, coords } of testCases) {
        // Step 1: Forward conversion (normalized -> screen)
        const screen = normalizedToScreen(coords, renderedWidth, renderedHeight);

        // Step 2: Backward conversion (screen -> normalized)
        const roundTrip = screenToNormalized(screen, renderedWidth, renderedHeight);

        // Step 3: Verify round-trip fidelity
        assert.ok(
          Math.abs(roundTrip.x - coords.x) < 1e-6,
          `Round-trip X failed for ${name} at zoom ${zoom * 100}%: expected ${coords.x}, got ${roundTrip.x}`
        );
        assert.ok(
          Math.abs(roundTrip.y - coords.y) < 1e-6,
          `Round-trip Y failed for ${name} at zoom ${zoom * 100}%: expected ${coords.y}, got ${roundTrip.y}`
        );
        assert.ok(
          Math.abs(roundTrip.width - coords.width) < 1e-6,
          `Round-trip Width failed for ${name} at zoom ${zoom * 100}%: expected ${coords.width}, got ${roundTrip.width}`
        );
        assert.ok(
          Math.abs(roundTrip.height - coords.height) < 1e-6,
          `Round-trip Height failed for ${name} at zoom ${zoom * 100}%: expected ${coords.height}, got ${roundTrip.height}`
        );
      }
    }
  });

  test('Point conversion round-trip across all zoom levels', async () => {
    const { normalizedPointToScreen, screenPointToNormalized } = await import('../src/utils/coordinates.ts');

    const canonicalWidth = 595.28;
    const canonicalHeight = 841.89;
    const zoomLevels = [0.25, 0.50, 1.00, 1.50, 2.00, 3.00];

    const testPoints = [
      { x: 0.0, y: 0.0 },
      { x: 0.5, y: 0.5 },
      { x: 0.75, y: 0.85 },
      { x: 1.0, y: 1.0 },
    ];

    for (const zoom of zoomLevels) {
      const renderedWidth = canonicalWidth * zoom;
      const renderedHeight = canonicalHeight * zoom;

      for (const point of testPoints) {
        const screenPoint = normalizedPointToScreen(point, renderedWidth, renderedHeight);
        const roundTripPoint = screenPointToNormalized(screenPoint, renderedWidth, renderedHeight);

        assert.ok(
          Math.abs(roundTripPoint.x - point.x) < 1e-6,
          `Point X round-trip failed at zoom ${zoom * 100}%: expected ${point.x}, got ${roundTripPoint.x}`
        );
        assert.ok(
          Math.abs(roundTripPoint.y - point.y) < 1e-6,
          `Point Y round-trip failed at zoom ${zoom * 100}%: expected ${point.y}, got ${roundTripPoint.y}`
        );
      }
    }
  });

  test('Mixed Page Orientations (Portrait and Landscape) preserve coordinates correctly', async () => {
    const { normalizedToScreen, screenToNormalized } = await import('../src/utils/coordinates.ts');

    const portrait = { width: 595.28, height: 841.89 };
    const landscape = { width: 841.89, height: 595.28 };

    const coords = { x: 0.60, y: 0.70, width: 0.25, height: 0.15 };

    // Portrait test
    const screenPortrait = normalizedToScreen(coords, portrait);
    const roundTripPortrait = screenToNormalized(screenPortrait, portrait);
    assert.strictEqual(roundTripPortrait.x, coords.x);
    assert.strictEqual(roundTripPortrait.y, coords.y);
    assert.strictEqual(roundTripPortrait.width, coords.width);
    assert.strictEqual(roundTripPortrait.height, coords.height);

    // Landscape test
    const screenLandscape = normalizedToScreen(coords, landscape);
    const roundTripLandscape = screenToNormalized(screenLandscape, landscape);
    assert.strictEqual(roundTripLandscape.x, coords.x);
    assert.strictEqual(roundTripLandscape.y, coords.y);
    assert.strictEqual(roundTripLandscape.width, coords.width);
    assert.strictEqual(roundTripLandscape.height, coords.height);
  });

  test('Edge cases and boundary protection in screenToNormalized', async () => {
    const { screenToNormalized, screenPointToNormalized } = await import('../src/utils/coordinates.ts');

    // 1. Zero or negative page dimensions return safe zeros
    const zeroDim = screenToNormalized({ x: 50, y: 50, width: 100, height: 100 }, 0, 0);
    assert.deepStrictEqual(zeroDim, { x: 0, y: 0, width: 0, height: 0 });

    const negDim = screenToNormalized({ x: 50, y: 50, width: 100, height: 100 }, -500, 800);
    assert.deepStrictEqual(negDim, { x: 0, y: 0, width: 0, height: 0 });

    const zeroPoint = screenPointToNormalized({ x: 50, y: 50 }, 0, 0);
    assert.deepStrictEqual(zeroPoint, { x: 0, y: 0 });

    // 2. Clamping option
    const overflowScreen = { x: 500, y: 800, width: 300, height: 300 };
    const clampedResult = screenToNormalized(overflowScreen, 600, 900, { clamp: true });
    assert.ok(clampedResult.x + clampedResult.width <= 1.0 + 1e-6);
    assert.ok(clampedResult.y + clampedResult.height <= 1.0 + 1e-6);

    // 3. Raw unrounded option
    const unroundedResult = screenToNormalized({ x: 1, y: 1, width: 1, height: 1 }, 3, 3, { round: false });
    assert.strictEqual(unroundedResult.x, 1 / 3);
  });
});
