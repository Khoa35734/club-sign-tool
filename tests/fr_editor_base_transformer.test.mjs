import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('FR-EDITOR-BASE: Konva Transformer, Dragging, Resizing & Normalized State Verification Test Suite', () => {
  const mockComponentPath = path.join(
    rootDir,
    'src',
    'features',
    'editor',
    'components',
    'MockEditorObject.tsx'
  );
  const hookPath = path.join(
    rootDir,
    'src',
    'features',
    'editor',
    'hooks',
    'useMockObjectTransform.ts'
  );
  const overlayComponentPath = path.join(
    rootDir,
    'src',
    'features',
    'editor',
    'components',
    'PdfEditorOverlay.tsx'
  );
  const storePath = path.join(rootDir, 'src', 'stores', 'useEditorStore.ts');
  const coordinatesUtilPath = path.join(rootDir, 'src', 'utils', 'coordinates.ts');

  test('Required source files for Transformer, dragging, and resizing controls exist and are non-empty', () => {
    assert.ok(fs.existsSync(mockComponentPath), 'MockEditorObject.tsx must exist');
    assert.ok(fs.statSync(mockComponentPath).size > 0, 'MockEditorObject.tsx must not be empty');

    assert.ok(fs.existsSync(hookPath), 'useMockObjectTransform.ts must exist');
    assert.ok(fs.statSync(hookPath).size > 0, 'useMockObjectTransform.ts must not be empty');

    assert.ok(fs.existsSync(overlayComponentPath), 'PdfEditorOverlay.tsx must exist');
    assert.ok(fs.statSync(overlayComponentPath).size > 0, 'PdfEditorOverlay.tsx must not be empty');
  });

  test('MockEditorObject and useMockObjectTransform adhere to component sizing standards (< 200 lines)', () => {
    const mockContent = fs.readFileSync(mockComponentPath, 'utf8');
    const hookContent = fs.readFileSync(hookPath, 'utf8');

    const mockLines = mockContent.split('\n').length;
    const hookLines = hookContent.split('\n').length;

    assert.ok(
      mockLines <= 200,
      `MockEditorObject.tsx must not exceed 200 lines (current: ${mockLines})`
    );
    assert.ok(
      hookLines <= 200,
      `useMockObjectTransform.ts must not exceed 200 lines (current: ${hookLines})`
    );
  });

  test('MockEditorObject integrates Konva Transformer and renders only when selected', () => {
    const content = fs.readFileSync(mockComponentPath, 'utf8');

    // Must import Transformer from react-konva
    assert.match(
      content,
      /import\s*\{[^}]*Transformer[^}]*\}\s*from\s*['"]react-konva['"]/,
      'Must import Transformer from react-konva'
    );

    // Must conditionally render Transformer when isSelected is true
    assert.match(
      content,
      /\{isSelected\s*&&\s*\(\s*<Transformer/,
      'Must render Transformer when isSelected is true'
    );

    // Must bind boundBoxFunc, anchorSize, borderStroke, and styling
    assert.match(content, /boundBoxFunc=\{boundBoxFunc\}/, 'Must bind boundBoxFunc');
    assert.match(content, /borderStroke=['"]#38bdf8['"]/, 'Must style border with accent sky-blue');
  });

  test('useMockObjectTransform manages drag handlers and converts screen coords to normalized space onDragEnd', () => {
    const content = fs.readFileSync(hookPath, 'utf8');

    // Must import screenToNormalized
    assert.match(
      content,
      /import\s*\{[^}]*screenToNormalized[^}]*\}\s*from\s*['"]@\/utils\/coordinates['"]/,
      'Must import screenToNormalized'
    );

    // Must implement handleDragEnd converting x, y back to normalized space
    assert.match(
      content,
      /const\s+handleDragEnd\s*=\s*useCallback\(/,
      'Must define handleDragEnd with useCallback'
    );
    assert.match(
      content,
      /screenToNormalized\(\s*\{[\s\S]*?x:\s*newScreenX,[\s\S]*?y:\s*newScreenY,[\s\S]*?stageWidth,\s*stageHeight,\s*\{\s*clamp:\s*true,\s*round:\s*true\s*\}\s*\)/,
      'Must call screenToNormalized with clamp and round on drag end'
    );

    // Must fire onTransformEnd callback with normalized x and y
    assert.match(
      content,
      /onTransformEnd\?\.\(object\.id,\s*\{\s*x:\s*normalized\.x,\s*y:\s*normalized\.y,\s*\}\)/,
      'Must emit onTransformEnd with normalized x and y'
    );
  });

  test('useMockObjectTransform manages Konva transform end, resets scale to 1, and normalizes rotation', () => {
    const content = fs.readFileSync(hookPath, 'utf8');

    // Must reset scaleX and scaleY to 1 on node to prevent compound scaling
    assert.match(content, /node\.scaleX\(1\);/, 'Must reset scaleX(1)');
    assert.match(content, /node\.scaleY\(1\);/, 'Must reset scaleY(1)');

    // Must normalize rotation into [0, 360)
    assert.match(
      content,
      /normalizedRotation\s*=\s*Math\.round\(\(\(rawRotation\s*%\s*360\)\s*\+\s*360\)\s*%\s*360\)/,
      'Must normalize rotation into [0, 360) range'
    );

    // Must emit new normalized bounding box (x, y, width, height, rotation)
    assert.match(
      content,
      /onTransformEnd\?\.\(object\.id,\s*\{\s*x:\s*normalized\.x,\s*y:\s*normalized\.y,\s*width:\s*normalized\.width,\s*height:\s*normalized\.height,\s*rotation:\s*normalizedRotation,\s*\}\)/,
      'Must emit updated normalized coordinates, dimensions, and rotation on transform end'
    );

    // Must implement boundBoxFunc to prevent dimensions < 10px
    assert.match(
      content,
      /if\s*\(Math\.abs\(newBox\.width\)\s*<\s*10\s*\|\|\s*Math\.abs\(newBox\.height\)\s*<\s*10\)\s*\{\s*return\s*oldBox;\s*\}/,
      'Must enforce min boundBox threshold of 10px'
    );
  });

  test('PdfEditorOverlay passes onTransformEnd updating useEditorStore', () => {
    const content = fs.readFileSync(overlayComponentPath, 'utf8');

    // Must retrieve updateObject from store
    assert.match(
      content,
      /const\s+updateObject\s*=\s*useEditorStore\(\(state\)\s*=>\s*state\.updateObject\)/,
      'Must access updateObject from useEditorStore'
    );

    // Must wire onTransformEnd in MockEditorObject
    assert.match(
      content,
      /<MockEditorObject[\s\S]*?onTransformEnd=\{[\s\S]*?updateObject\(id,\s*updates\)[\s\S]*?\}/,
      'Must bind onTransformEnd to updateObject'
    );
  });

  test('Functional simulation: Dragging updates normalized coordinates accurately across zoom levels', async () => {
    const { screenToNormalized, normalizedToScreen } = await import(
      `file://${coordinatesUtilPath.replace(/\\/g, '/')}`
    );

    // Canonical A4 Page: 595.28 x 841.89
    const canonicalW = 595.28;
    const canonicalH = 841.89;

    // Placed object starting at (0.2, 0.3) with size (0.25, 0.15)
    const initialObject = {
      x: 0.2,
      y: 0.3,
      width: 0.25,
      height: 0.15,
    };

    const zoomLevels = [0.5, 1.0, 1.5, 2.0, 3.0];

    for (const zoom of zoomLevels) {
      const stageW = Math.round(canonicalW * zoom);
      const stageH = Math.round(canonicalH * zoom);

      // Render to screen
      const screenPos = normalizedToScreen(initialObject, stageW, stageH);

      // User drags object to a target screen position: ~35% across, ~45% down
      const targetScreenX = Math.round(stageW * 0.35);
      const targetScreenY = Math.round(stageH * 0.45);

      // Convert back to normalized coordinates via onDragEnd logic
      const updatedNormalized = screenToNormalized(
        {
          x: targetScreenX,
          y: targetScreenY,
          width: screenPos.width,
          height: screenPos.height,
        },
        stageW,
        stageH,
        { clamp: true, round: true }
      );

      // Tolerance is at most 1 pixel resolution (1 / stage dimension)
      const toleranceX = 1 / stageW;
      const toleranceY = 1 / stageH;

      assert.ok(
        Math.abs(updatedNormalized.x - 0.35) <= toleranceX + 1e-5,
        `Normalized X after drag at zoom ${zoom} must match target within 1px tolerance`
      );
      assert.ok(
        Math.abs(updatedNormalized.y - 0.45) <= toleranceY + 1e-5,
        `Normalized Y after drag at zoom ${zoom} must match target within 1px tolerance`
      );

      // Verify zoom invariance: converting updated normalized coords to a different zoom level
      // maps to the proportional document location
      const otherZoom = 2.5;
      const otherStageW = Math.round(canonicalW * otherZoom);
      const otherStageH = Math.round(canonicalH * otherZoom);
      const otherScreenCoords = normalizedToScreen(
        { x: updatedNormalized.x, y: updatedNormalized.y, width: 0.25, height: 0.15 },
        otherStageW,
        otherStageH
      );
      assert.ok(
        Math.abs(otherScreenCoords.x / otherStageW - updatedNormalized.x) <= 1 / otherStageW + 1e-5,
        'Preserves normalized X position when rendered at different zoom level'
      );
      assert.ok(
        Math.abs(otherScreenCoords.y / otherStageH - updatedNormalized.y) <= 1 / otherStageH + 1e-5,
        'Preserves normalized Y position when rendered at different zoom level'
      );
    }
  });

  test('Functional simulation: Transformer resizing scales normalized dimensions accurately', async () => {
    const { screenToNormalized, normalizedToScreen } = await import(
      `file://${coordinatesUtilPath.replace(/\\/g, '/')}`
    );

    const canonicalW = 595.28;
    const canonicalH = 841.89;

    const initialObject = {
      x: 0.15,
      y: 0.25,
      width: 0.3,
      height: 0.2,
      rotation: 0,
    };

    const stageW = Math.round(canonicalW * 1.5);
    const stageH = Math.round(canonicalH * 1.5);

    const screenCoords = normalizedToScreen(initialObject, stageW, stageH);

    // Simulate Konva transformer scale: scaleX = 1.4, scaleY = 1.2
    const scaleX = 1.4;
    const scaleY = 1.2;
    const newWidth = screenCoords.width * scaleX;
    const newHeight = screenCoords.height * scaleY;

    // Convert transformed bounds back to normalized space
    const transformedNorm = screenToNormalized(
      {
        x: screenCoords.x,
        y: screenCoords.y,
        width: newWidth,
        height: newHeight,
      },
      stageW,
      stageH,
      { clamp: true, round: true }
    );

    assert.ok(
      Math.abs(transformedNorm.width - initialObject.width * scaleX) < 1e-3,
      'Transformed width must match scaled normalized width'
    );
    assert.ok(
      Math.abs(transformedNorm.height - initialObject.height * scaleY) < 1e-3,
      'Transformed height must match scaled normalized height'
    );
  });

  test('Functional simulation: Rotation normalization preserves angles in [0, 360) range', () => {
    const normalizeRotation = (rawRotation) => Math.round(((rawRotation % 360) + 360) % 360);

    assert.equal(normalizeRotation(0), 0);
    assert.equal(normalizeRotation(90), 90);
    assert.equal(normalizeRotation(360), 0);
    assert.equal(normalizeRotation(450), 90);
    assert.equal(normalizeRotation(-90), 270);
    assert.equal(normalizeRotation(-180), 180);
    assert.equal(normalizeRotation(-45), 315);
    assert.equal(normalizeRotation(720), 0);
  });

  test('Functional simulation: Clamping prevents objects from escaping normalized boundaries [0.0 - 1.0]', async () => {
    const { screenToNormalized } = await import(
      `file://${coordinatesUtilPath.replace(/\\/g, '/')}`
    );

    const stageW = 1000;
    const stageH = 1000;

    // Dragged way outside top-left (-500, -200)
    const outTopLeft = screenToNormalized(
      { x: -500, y: -200, width: 200, height: 100 },
      stageW,
      stageH,
      { clamp: true, round: true }
    );
    assert.equal(outTopLeft.x, 0.0, 'X must clamp to 0.0');
    assert.equal(outTopLeft.y, 0.0, 'Y must clamp to 0.0');

    // Dragged way outside bottom-right (+1500, +2000)
    const outBottomRight = screenToNormalized(
      { x: 1500, y: 2000, width: 200, height: 100 },
      stageW,
      stageH,
      { clamp: true, round: true }
    );
    assert.equal(outBottomRight.x, 1.0, 'X must clamp to 1.0');
    assert.equal(outBottomRight.y, 1.0, 'Y must clamp to 1.0');
  });

  test('Functional simulation: Immutable object update logic preserves state integrity', () => {
    const storeContent = fs.readFileSync(storePath, 'utf8');

    // Verify useEditorStore has updateObject implementing immutable map
    assert.match(
      storeContent,
      /updateObject:\s*\(id:\s*string,\s*updates:\s*Partial<EditorObject>\)\s*=>\s*void/,
      'Must declare updateObject signature'
    );
    assert.match(
      storeContent,
      /state\.objects\.map\(\(obj\)\s*=>\s*\(obj\.id\s*===\s*id\s*\?\s*\{\s*\.\.\.obj,\s*\.\.\.updates\s*\}\s*:\s*obj\)\)/,
      'updateObject must use immutable map pattern'
    );

    // Simulate store update logic directly
    const initialObjects = [
      {
        id: 'obj-1',
        type: 'signature',
        pageIndex: 0,
        pageNumber: 1,
        x: 0.1,
        y: 0.1,
        width: 0.2,
        height: 0.1,
        rotation: 0,
        opacity: 1.0,
        zIndex: 1,
      },
    ];

    const updates = { x: 0.35, y: 0.45, rotation: 30 };
    const updatedObjects = initialObjects.map((obj) =>
      obj.id === 'obj-1' ? { ...obj, ...updates } : obj
    );

    assert.notEqual(updatedObjects, initialObjects, 'Must create new array reference');
    assert.notEqual(updatedObjects[0], initialObjects[0], 'Must create new object reference');
    assert.equal(updatedObjects[0].x, 0.35);
    assert.equal(updatedObjects[0].y, 0.45);
    assert.equal(updatedObjects[0].rotation, 30);
    assert.equal(updatedObjects[0].width, 0.2); // preserved
  });
});
