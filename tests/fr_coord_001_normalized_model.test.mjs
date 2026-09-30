import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('FR-COORD-001: Invariant Normalized Coordinate Model Specification Test Suite', () => {
  const editorTypesPath = path.join(rootDir, 'src', 'types', 'editor.ts');
  const canvasTypesPath = path.join(rootDir, 'src', 'types', 'canvas.ts');
  const indexTypesPath = path.join(rootDir, 'src', 'types', 'index.ts');
  const coordinatesUtilPath = path.join(rootDir, 'src', 'utils', 'coordinates.ts');

  test('src/types/editor.ts exists and declares NormalizedCoordinates & EditorObject', () => {
    assert.ok(fs.existsSync(editorTypesPath), 'src/types/editor.ts must exist');
    const content = fs.readFileSync(editorTypesPath, 'utf8');

    // Must declare NormalizedCoordinates
    assert.match(
      content,
      /export interface NormalizedCoordinates\s*\{/,
      'Must declare NormalizedCoordinates interface'
    );

    // Must declare EditorObjectType
    assert.match(
      content,
      /export type EditorObjectType\s*=\s*'signature' \| 'stamp' \| 'text' \| 'date'/,
      'EditorObjectType must include signature, stamp, text, date'
    );

    // Must declare EditorObject
    assert.match(
      content,
      /export interface EditorObject\s*(extends\s*NormalizedCoordinates)?\s*\{/,
      'Must declare EditorObject interface'
    );
  });

  test('EditorObject strictly documents x, y, width, height as normalized [0.0 - 1.0]', () => {
    const content = fs.readFileSync(editorTypesPath, 'utf8');

    // Strict JSDoc and type specifications for normalized properties
    assert.match(
      content,
      /x:\s*number;/,
      'EditorObject must declare x as number'
    );
    assert.match(
      content,
      /y:\s*number;/,
      'EditorObject must declare y as number'
    );
    assert.match(
      content,
      /width:\s*number;/,
      'EditorObject must declare width as number'
    );
    assert.match(
      content,
      /height:\s*number;/,
      'EditorObject must declare height as number'
    );

    // Must document normalized range [0.0 - 1.0] in JSDoc comments
    assert.match(
      content,
      /\[0\.0[,\s-]+1\.0\]/i,
      'Documentation must explicitly mention normalized range [0.0 - 1.0]'
    );
    assert.match(
      content,
      /page\s*width/i,
      'Documentation must explain relative division by page width'
    );
    assert.match(
      content,
      /page\s*height/i,
      'Documentation must explain relative division by page height'
    );
  });

  test('src/types/canvas.ts and src/types/index.ts re-export EditorObject definitions', () => {
    const canvasContent = fs.readFileSync(canvasTypesPath, 'utf8');
    const indexContent = fs.readFileSync(indexTypesPath, 'utf8');

    assert.match(
      canvasContent,
      /export type\s*\{[^}]*EditorObject[^}]*\}\s*from '\.\/editor';/,
      'src/types/canvas.ts must re-export EditorObject from ./editor'
    );

    assert.match(
      indexContent,
      /export \* from '\.\/editor';/,
      'src/types/index.ts must export all from ./editor'
    );
  });

  test('src/utils/coordinates.ts exports invariant coordinate checking and clamping functions', async () => {
    assert.ok(fs.existsSync(coordinatesUtilPath), 'src/utils/coordinates.ts must exist');

    // Dynamically import compiled or source module
    const {
      isNormalizedCoordinate,
      clampNormalizedCoordinate,
      isNormalizedRect,
      clampNormalizedRect,
      createNormalizedCoordinates,
    } = await import('../src/utils/coordinates.ts');

    // 1. Scalar coordinate validation
    assert.strictEqual(isNormalizedCoordinate(0.0), true, '0.0 is valid');
    assert.strictEqual(isNormalizedCoordinate(0.5), true, '0.5 is valid');
    assert.strictEqual(isNormalizedCoordinate(1.0), true, '1.0 is valid');
    assert.strictEqual(isNormalizedCoordinate(-0.1), false, '-0.1 is invalid');
    assert.strictEqual(isNormalizedCoordinate(1.1), false, '1.1 is invalid');
    assert.strictEqual(isNormalizedCoordinate(NaN), false, 'NaN is invalid');
    assert.strictEqual(isNormalizedCoordinate(Infinity), false, 'Infinity is invalid');

    // 2. Scalar coordinate clamping
    assert.strictEqual(clampNormalizedCoordinate(-0.5), 0.0, 'clamp negative to 0.0');
    assert.strictEqual(clampNormalizedCoordinate(1.5), 1.0, 'clamp > 1.0 to 1.0');
    assert.strictEqual(clampNormalizedCoordinate(0.75), 0.75, 'keep valid in-range value');
    assert.strictEqual(clampNormalizedCoordinate(NaN), 0.0, 'NaN clamps to 0.0');

    // 3. Rect validation
    assert.strictEqual(
      isNormalizedRect({ x: 0.1, y: 0.2, width: 0.4, height: 0.3 }),
      true,
      'Valid bounding box inside page'
    );
    assert.strictEqual(
      isNormalizedRect({ x: 0.8, y: 0.2, width: 0.4, height: 0.3 }),
      false,
      'Right edge (0.8 + 0.4 = 1.2) exceeds page width'
    );
    assert.strictEqual(
      isNormalizedRect({ x: 0.1, y: 0.9, width: 0.2, height: 0.3 }),
      false,
      'Bottom edge (0.9 + 0.3 = 1.2) exceeds page height'
    );
    assert.strictEqual(
      isNormalizedRect({ x: 0.1, y: 0.1, width: -0.2, height: 0.3 }),
      false,
      'Negative width is rejected'
    );

    // 4. Rect clamping
    const clampedOverflow = clampNormalizedRect({ x: 0.8, y: 0.8, width: 0.5, height: 0.5 });
    assert.strictEqual(clampedOverflow.x, 0.8);
    assert.strictEqual(clampedOverflow.y, 0.8);
    assert.strictEqual(clampedOverflow.width, 0.2); // 1.0 - 0.8
    assert.strictEqual(clampedOverflow.height, 0.2); // 1.0 - 0.8

    // 5. createNormalizedCoordinates
    const created = createNormalizedCoordinates(0.15, 0.25, 0.3, 0.4);
    assert.deepStrictEqual(created, { x: 0.15, y: 0.25, width: 0.3, height: 0.4 });
  });

  test('Zoom and Screen Invariance: round-trip mapping across multiple zoom levels', () => {
    // Canonical PDF page dimensions (A4 portrait: 595.28 x 841.89 points)
    const canonicalWidth = 595.28;
    const canonicalHeight = 841.89;

    // Placed object in normalized coordinates
    const originalNormalized = {
      x: 0.65,      // Bottom-right signature area
      y: 0.80,
      width: 0.25,  // 25% of page width
      height: 0.10, // 10% of page height
    };

    const zoomLevels = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0];

    for (const zoom of zoomLevels) {
      const renderedWidth = canonicalWidth * zoom;
      const renderedHeight = canonicalHeight * zoom;

      // Project to Screen pixels
      const screenX = originalNormalized.x * renderedWidth;
      const screenY = originalNormalized.y * renderedHeight;
      const screenWidth = originalNormalized.width * renderedWidth;
      const screenHeight = originalNormalized.height * renderedHeight;

      // Unproject back to Normalized coordinates
      const unprojectedNormalized = {
        x: screenX / renderedWidth,
        y: screenY / renderedHeight,
        width: screenWidth / renderedWidth,
        height: screenHeight / renderedHeight,
      };

      assert.ok(
        Math.abs(unprojectedNormalized.x - originalNormalized.x) < 1e-9,
        `X must remain invariant at zoom ${zoom * 100}%`
      );
      assert.ok(
        Math.abs(unprojectedNormalized.y - originalNormalized.y) < 1e-9,
        `Y must remain invariant at zoom ${zoom * 100}%`
      );
      assert.ok(
        Math.abs(unprojectedNormalized.width - originalNormalized.width) < 1e-9,
        `Width must remain invariant at zoom ${zoom * 100}%`
      );
      assert.ok(
        Math.abs(unprojectedNormalized.height - originalNormalized.height) < 1e-9,
        `Height must remain invariant at zoom ${zoom * 100}%`
      );
    }
  });

  test('Mixed Page Sizes: Normalized coordinates maintain proportional placement across Portrait and Landscape pages', () => {
    const portraitPage = { widthPt: 595.28, heightPt: 841.89 };
    const landscapePage = { widthPt: 841.89, heightPt: 595.28 };

    // Standard stamp placement at bottom-right corner (margin 5%, size 20%)
    const stampPlacement = {
      x: 0.75,
      y: 0.75,
      width: 0.20,
      height: 0.20,
    };

    // Calculate physical placement on portrait page
    const portraitPhysicalX = stampPlacement.x * portraitPage.widthPt;
    const portraitPhysicalY = stampPlacement.y * portraitPage.heightPt;
    assert.strictEqual(portraitPhysicalX, 0.75 * 595.28);
    assert.strictEqual(portraitPhysicalY, 0.75 * 841.89);

    // Calculate physical placement on landscape page
    const landscapePhysicalX = stampPlacement.x * landscapePage.widthPt;
    const landscapePhysicalY = stampPlacement.y * landscapePage.heightPt;
    assert.strictEqual(landscapePhysicalX, 0.75 * 841.89);
    assert.strictEqual(landscapePhysicalY, 0.75 * 595.28);

    // The normalized coordinates themselves do not mutate
    assert.strictEqual(stampPlacement.x, 0.75);
    assert.strictEqual(stampPlacement.y, 0.75);
  });
});
