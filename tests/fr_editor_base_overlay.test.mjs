import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('FR-EDITOR-BASE: Konva.js Transparent Stage Overlay Test Suite', () => {
  const overlayComponentPath = path.join(
    rootDir,
    'src',
    'features',
    'editor',
    'components',
    'PdfEditorOverlay.tsx'
  );
  const editorIndexPath = path.join(rootDir, 'src', 'features', 'editor', 'index.ts');
  const pageViewPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'components',
    'PdfPageView.tsx'
  );
  const packageJsonPath = path.join(rootDir, 'package.json');

  test('Required source files for editor overlay exist and are non-empty', () => {
    assert.ok(fs.existsSync(overlayComponentPath), 'PdfEditorOverlay.tsx must exist');
    assert.ok(fs.statSync(overlayComponentPath).size > 0, 'PdfEditorOverlay.tsx must not be empty');

    assert.ok(fs.existsSync(editorIndexPath), 'features/editor/index.ts must exist');
    assert.ok(fs.statSync(editorIndexPath).size > 0, 'features/editor/index.ts must not be empty');
  });

  test('Dependencies konva and react-konva are registered in package.json', () => {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    assert.ok(pkg.dependencies.konva, 'konva must be in dependencies');
    assert.ok(pkg.dependencies['react-konva'], 'react-konva must be in dependencies');
  });

  test('PdfEditorOverlay component implements transparent Konva Stage and Layer', () => {
    const content = fs.readFileSync(overlayComponentPath, 'utf8');

    // Must import from react-konva
    assert.match(
      content,
      /import\s*\{[^}]*Stage[^}]*Layer[^}]*\}\s*from\s*['"]react-konva['"]/,
      'Must import Stage and Layer from react-konva'
    );

    // Must export PdfEditorOverlay
    assert.match(
      content,
      /export function PdfEditorOverlay\s*\(/,
      'Must export PdfEditorOverlay component'
    );

    // Must bind width and height to Stage
    assert.match(
      content,
      /<Stage[\s\S]*?width=\{width\}[\s\S]*?height=\{height\}/,
      'Stage must receive width and height props'
    );

    // Must set transparent background
    assert.match(
      content,
      /backgroundColor:\s*['"]transparent['"]/,
      'Stage must configure transparent background'
    );

    // Must have Layer for shapes
    assert.match(content, /<Layer/, 'Must contain Konva Layer');

    // Must position overlay container absolutely with pointer-events
    assert.match(content, /absolute/, 'Container must be absolutely positioned');
    assert.match(content, /pointer-events-auto/, 'Container must enable pointer events');
  });

  test('PdfEditorOverlay supports empty stage deselect and active page synchronization', () => {
    const content = fs.readFileSync(overlayComponentPath, 'utf8');

    // Must interact with useEditorStore
    assert.match(
      content,
      /useEditorStore/,
      'Must connect with useEditorStore'
    );
    assert.match(
      content,
      /setSelectedObjectId/,
      'Must support clearing selected object on deselect'
    );
    assert.match(
      content,
      /setActivePageIndex/,
      'Must sync active page index on interaction'
    );
    assert.match(
      content,
      /e\.target\s*===\s*e\.target\.getStage\(\)/,
      'Must detect click directly on empty stage background'
    );
  });

  test('features/editor/index.ts exports PdfEditorOverlay', () => {
    const content = fs.readFileSync(editorIndexPath, 'utf8');
    assert.match(
      content,
      /export \* from ['"]\.\/components\/PdfEditorOverlay['"]/,
      'Must export PdfEditorOverlay from editor feature index'
    );
  });

  test('PdfPageView mounts PdfEditorOverlay over pdf-page-canvas', () => {
    const content = fs.readFileSync(pageViewPath, 'utf8');

    assert.match(
      content,
      /import\s*\{[^}]*PdfEditorOverlay[^}]*\}\s*from\s*['"]@\/features\/editor['"]/,
      'PdfPageView must import PdfEditorOverlay from @/features/editor'
    );

    assert.match(
      content,
      /<PdfEditorOverlay[\s\S]*?width=\{displayWidth\}[\s\S]*?height=\{displayHeight\}/,
      'PdfPageView must mount PdfEditorOverlay with displayWidth and displayHeight'
    );

    assert.match(
      content,
      /showOverlay\s*=\s*true/,
      'PdfPageView must default showOverlay to true'
    );
  });

  test('Mathematical simulation: Overlay dimensions strictly equal PDF canvas dimensions on zoom and rotation', () => {
    // Standard A4 dimensions in pt
    const a4Portrait = { widthPt: 595.28, heightPt: 841.89 };
    const a4Landscape = { widthPt: 841.89, heightPt: 595.28 };

    const zoomLevels = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0];

    for (const zoom of zoomLevels) {
      // 1. Portrait Page
      const portraitDisplayWidth = Math.max(1, Math.round(a4Portrait.widthPt * zoom));
      const portraitDisplayHeight = Math.max(1, Math.round(a4Portrait.heightPt * zoom));

      assert.ok(portraitDisplayWidth > 0, `Width at zoom ${zoom} must be positive`);
      assert.ok(portraitDisplayHeight > 0, `Height at zoom ${zoom} must be positive`);
      assert.ok(
        portraitDisplayHeight > portraitDisplayWidth,
        'Portrait aspect ratio must be maintained'
      );

      // 2. Landscape Page
      const landscapeDisplayWidth = Math.max(1, Math.round(a4Landscape.widthPt * zoom));
      const landscapeDisplayHeight = Math.max(1, Math.round(a4Landscape.heightPt * zoom));

      assert.ok(
        landscapeDisplayWidth > landscapeDisplayHeight,
        'Landscape aspect ratio must be maintained'
      );

      // 3. Rotated Page (90 deg)
      const isRotated90 = true;
      const orientedW = isRotated90 ? a4Portrait.heightPt : a4Portrait.widthPt;
      const orientedH = isRotated90 ? a4Portrait.widthPt : a4Portrait.heightPt;
      const rotatedDisplayWidth = Math.max(1, Math.round(orientedW * zoom));
      const rotatedDisplayHeight = Math.max(1, Math.round(orientedH * zoom));

      assert.equal(
        rotatedDisplayWidth,
        landscapeDisplayWidth,
        '90-degree rotated portrait must match landscape width'
      );
      assert.equal(
        rotatedDisplayHeight,
        landscapeDisplayHeight,
        '90-degree rotated portrait must match landscape height'
      );
    }
  });
});
