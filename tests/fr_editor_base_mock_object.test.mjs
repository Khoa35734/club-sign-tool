import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('FR-EDITOR-BASE: Generic Mock Object Rendering & Normalized State Pinning Test Suite', () => {
  const mockComponentPath = path.join(
    rootDir,
    'src',
    'features',
    'editor',
    'components',
    'MockEditorObject.tsx'
  );
  const mockUtilPath = path.join(
    rootDir,
    'src',
    'features',
    'editor',
    'utils',
    'mockObject.ts'
  );
  const overlayComponentPath = path.join(
    rootDir,
    'src',
    'features',
    'editor',
    'components',
    'PdfEditorOverlay.tsx'
  );
  const editorIndexPath = path.join(rootDir, 'src', 'features', 'editor', 'index.ts');
  const storePath = path.join(rootDir, 'src', 'stores', 'useEditorStore.ts');
  const coordinatesUtilPath = path.join(rootDir, 'src', 'utils', 'coordinates.ts');

  test('Required source files for mock editor object exist and are non-empty', () => {
    assert.ok(fs.existsSync(mockComponentPath), 'MockEditorObject.tsx must exist');
    assert.ok(fs.statSync(mockComponentPath).size > 0, 'MockEditorObject.tsx must not be empty');

    assert.ok(fs.existsSync(mockUtilPath), 'mockObject.ts must exist');
    assert.ok(fs.statSync(mockUtilPath).size > 0, 'mockObject.ts must not be empty');

    assert.ok(fs.existsSync(editorIndexPath), 'editor/index.ts must exist');
    assert.ok(fs.statSync(editorIndexPath).size > 0, 'editor/index.ts must not be empty');
  });

  test('MockEditorObject component renders Konva Group, Rect, and Text with normalized coordinates', () => {
    const content = fs.readFileSync(mockComponentPath, 'utf8');

    // Must import Konva Group, Rect, Text from react-konva
    assert.match(
      content,
      /import\s*\{[^}]*Group[^}]*Rect[^}]*Text[^}]*\}\s*from\s*['"]react-konva['"]/,
      'Must import Group, Rect, Text from react-konva'
    );

    // Must import normalizedToScreen conversion utility
    assert.match(
      content,
      /import\s*\{[^}]*normalizedToScreen[^}]*\}\s*from\s*['"]@\/utils\/coordinates['"]/,
      'Must import normalizedToScreen from coordinates utility'
    );

    // Must compute screen coordinates using stageWidth and stageHeight
    assert.match(
      content,
      /normalizedToScreen\([\s\S]*?stageWidth,\s*stageHeight\s*\)/,
      'Must compute screen coordinates using current stage dimensions'
    );

    // Must render colored Rect with fill and stroke
    assert.match(
      content,
      /<Rect[\s\S]*?fill=\{object\.color/,
      'Must render colored Rect using object.color'
    );

    // Must render accessible Text label
    assert.match(
      content,
      /<Text[\s\S]*?text=\{labelText\}/,
      'Must render Text label overlay'
    );
  });

  test('createMockEditorObject utility generates valid normalized EditorObject', async () => {
    const { createMockEditorObject } = await import(
      `file://${mockUtilPath.replace(/\\/g, '/')}`
    );

    const mock = createMockEditorObject(0);
    assert.ok(mock.id, 'Must generate unique ID');
    assert.equal(mock.pageIndex, 0, 'pageIndex must match');
    assert.equal(mock.pageNumber, 1, 'pageNumber must be 1-based (pageIndex + 1)');
    assert.ok(mock.x >= 0.0 && mock.x <= 1.0, 'x must be normalized [0.0, 1.0]');
    assert.ok(mock.y >= 0.0 && mock.y <= 1.0, 'y must be normalized [0.0, 1.0]');
    assert.ok(mock.width > 0.0 && mock.width <= 1.0, 'width must be normalized');
    assert.ok(mock.height > 0.0 && mock.height <= 1.0, 'height must be normalized');
    assert.ok(mock.color, 'Must have color attribute');

    // Custom overrides
    const custom = createMockEditorObject(2, {
      color: '#ef4444',
      textPayload: 'CHỦ NHIỆM CLB',
      x: 0.5,
      y: 0.7,
    });
    assert.equal(custom.pageIndex, 2);
    assert.equal(custom.pageNumber, 3);
    assert.equal(custom.color, '#ef4444');
    assert.equal(custom.textPayload, 'CHỦ NHIỆM CLB');
    assert.equal(custom.x, 0.5);
    assert.equal(custom.y, 0.7);
  });

  test('PdfEditorOverlay integrates MockEditorObject and renders objects from store or props', () => {
    const content = fs.readFileSync(overlayComponentPath, 'utf8');

    // Must import MockEditorObject
    assert.match(
      content,
      /import\s*\{[^}]*MockEditorObject[^}]*\}\s*from\s*['"]\.\/MockEditorObject['"]/,
      'PdfEditorOverlay must import MockEditorObject'
    );

    // Must accept objects prop
    assert.match(
      content,
      /objects\?: EditorObject\[\]/,
      'PdfEditorOverlayProps must declare optional objects array'
    );

    // Must map objects to MockEditorObject
    assert.match(
      content,
      /<MockEditorObject[\s\S]*?key=\{obj\.id\}[\s\S]*?object=\{obj\}/,
      'Must map display objects to MockEditorObject components'
    );
  });

  test('useEditorStore provides immutable object management actions (addObject, updateObject, removeObject, setObjects)', () => {
    const content = fs.readFileSync(storePath, 'utf8');

    assert.match(content, /addObject:\s*\(object:\s*EditorObject\)\s*=>\s*void/, 'Must declare addObject');
    assert.match(content, /updateObject:\s*\(id:\s*string,\s*updates:\s*Partial<EditorObject>\)\s*=>\s*void/, 'Must declare updateObject');
    assert.match(content, /removeObject:\s*\(id:\s*string\)\s*=>\s*void/, 'Must declare removeObject');
    assert.match(content, /setObjects:\s*\(objects:\s*EditorObject\[\]\)\s*=>\s*void/, 'Must declare setObjects');
  });

  test('Verification of Pinning Invariant: Mock object stays pinned to exact document location across all zoom levels and window resizes', async () => {
    const { normalizedToScreen, screenToNormalized } = await import(
      `file://${coordinatesUtilPath.replace(/\\/g, '/')}`
    );

    // Canonical A4 Dimensions (595.28 x 841.89 pt)
    const canonicalWidth = 595.28;
    const canonicalHeight = 841.89;

    // Define mock placement object at normalized location (25% across, 40% down, 30% wide, 15% high)
    const mockObject = {
      x: 0.25,
      y: 0.4,
      width: 0.3,
      height: 0.15,
    };

    // Zoom levels: 25% to 400%
    const zoomLevels = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 3.5, 4.0];

    for (const zoom of zoomLevels) {
      const stageWidth = Math.max(1, Math.round(canonicalWidth * zoom));
      const stageHeight = Math.max(1, Math.round(canonicalHeight * zoom));

      const screenCoords = normalizedToScreen(mockObject, stageWidth, stageHeight);

      // Verify relative document location is invariant
      const relativeX = screenCoords.x / stageWidth;
      const relativeY = screenCoords.y / stageHeight;
      const relativeW = screenCoords.width / stageWidth;
      const relativeH = screenCoords.height / stageHeight;

      assert.ok(
        Math.abs(relativeX - mockObject.x) < 1e-6,
        `X relative location at zoom ${zoom} must match normalized X exactly`
      );
      assert.ok(
        Math.abs(relativeY - mockObject.y) < 1e-6,
        `Y relative location at zoom ${zoom} must match normalized Y exactly`
      );
      assert.ok(
        Math.abs(relativeW - mockObject.width) < 1e-6,
        `Width relative scale at zoom ${zoom} must match normalized width exactly`
      );
      assert.ok(
        Math.abs(relativeH - mockObject.height) < 1e-6,
        `Height relative scale at zoom ${zoom} must match normalized height exactly`
      );

      // Round-trip conversion back to normalized
      const roundTrip = screenToNormalized(screenCoords, stageWidth, stageHeight);
      assert.ok(Math.abs(roundTrip.x - mockObject.x) < 1e-5, 'Round-trip X matches');
      assert.ok(Math.abs(roundTrip.y - mockObject.y) < 1e-5, 'Round-trip Y matches');
      assert.ok(Math.abs(roundTrip.width - mockObject.width) < 1e-5, 'Round-trip Width matches');
      assert.ok(Math.abs(roundTrip.height - mockObject.height) < 1e-5, 'Round-trip Height matches');
    }

    // Dynamic Window Resizes (arbitrary container widths from 640px to 3840px)
    const windowContainerWidths = [640, 768, 1024, 1280, 1440, 1920, 2560, 3840];
    for (const winWidth of windowContainerWidths) {
      // Simulate Fit Width calculation: page fills 85% of window container
      const targetWidth = Math.round(winWidth * 0.85);
      const fitZoom = targetWidth / canonicalWidth;
      const stageWidth = targetWidth;
      const stageHeight = Math.round(canonicalHeight * fitZoom);

      const screenCoords = normalizedToScreen(mockObject, stageWidth, stageHeight);

      // Pinned verification
      assert.ok(
        Math.abs(screenCoords.x / stageWidth - mockObject.x) < 1e-6,
        `Pinned X position preserved at window width ${winWidth}px`
      );
      assert.ok(
        Math.abs(screenCoords.y / stageHeight - mockObject.y) < 1e-6,
        `Pinned Y position preserved at window width ${winWidth}px`
      );
    }
  });

  test('editor/index.ts exports MockEditorObject and createMockEditorObject', () => {
    const content = fs.readFileSync(editorIndexPath, 'utf8');
    assert.match(
      content,
      /export \* from ['"]\.\/components\/MockEditorObject['"]/,
      'Must export MockEditorObject'
    );
    assert.match(
      content,
      /export \* from ['"]\.\/utils\/mockObject['"]/,
      'Must export mockObject utilities'
    );
  });
});
