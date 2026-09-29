import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('FR-FILE-001: Drag & Drop Zone for Opening Documents Test Suite', () => {
  const hookPath = path.join(rootDir, 'src', 'features', 'document', 'hooks', 'useFileDrop.ts');
  const componentPath = path.join(rootDir, 'src', 'features', 'document', 'components', 'DropZone.tsx');
  const indexPath = path.join(rootDir, 'src', 'features', 'document', 'index.ts');
  const appPath = path.join(rootDir, 'src', 'App.tsx');
  const fileUtilsPath = path.join(rootDir, 'src', 'utils', 'file.ts');

  test('Required source files for Drag & Drop feature exist and are non-empty', () => {
    const requiredFiles = [
      hookPath,
      componentPath,
      indexPath,
      appPath,
      fileUtilsPath,
    ];

    for (const f of requiredFiles) {
      assert.ok(fs.existsSync(f), `File must exist: ${f}`);
      const stat = fs.statSync(f);
      assert.ok(stat.size > 0, `File must be non-empty: ${f}`);
    }
  });

  test('useFileDrop hook implements drag state, drop handling, and Tauri event listener', () => {
    const content = fs.readFileSync(hookPath, 'utf8');

    assert.match(content, /export function useFileDrop/, 'Must export useFileDrop hook');
    assert.match(content, /isDragging/, 'Must track isDragging state');
    assert.match(content, /error/, 'Must track error state');
    assert.match(content, /processDroppedPath/, 'Must implement processDroppedPath');
    assert.match(content, /isSupportedDocument/, 'Must validate supported document formats');
    assert.match(content, /setFilePath/, 'Must update document store on valid file drop');
    assert.match(content, /onDragEnter/, 'Must provide onDragEnter handler');
    assert.match(content, /onDragOver/, 'Must provide onDragOver handler');
    assert.match(content, /onDragLeave/, 'Must provide onDragLeave handler');
    assert.match(content, /onDrop/, 'Must provide onDrop handler');
    assert.match(content, /onDragDropEvent/, 'Must subscribe to native Tauri window DragDropEvent');
  });

  test('DropZone component provides accessible, visual drop zone with format indicators', () => {
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.match(content, /export function DropZone/, 'Must export DropZone component');
    assert.match(content, /data-testid="drop-zone"/, 'Must have data-testid="drop-zone" for automated testing');
    assert.match(content, /useFileDrop\(\)/, 'Must use useFileDrop hook');
    assert.match(content, /onOpenFile/, 'Must accept onOpenFile prop for fallback file dialog');
    assert.match(content, /role="alert"/, 'Must render accessible error alert when invalid file dropped');
    assert.match(content, /\.PDF/, 'Must display PDF badge');
    assert.match(content, /\.DOCX/, 'Must display DOCX badge');
    assert.match(content, /\.DOC/, 'Must display DOC badge');
    assert.match(content, /100% ngoại tuyến/, 'Must display offline invariant notice');
  });

  test('Document feature index exports DropZone and useFileDrop', () => {
    const content = fs.readFileSync(indexPath, 'utf8');

    assert.match(content, /export \* from '\.\/hooks\/useFileDrop'/, 'Must re-export useFileDrop');
    assert.match(content, /export \* from '\.\/components\/DropZone'/, 'Must re-export DropZone');
  });

  test('App component mounts DropZone when no document is active', () => {
    const content = fs.readFileSync(appPath, 'utf8');

    assert.match(content, /import\s*\{[^}]*DropZone[^}]*\}\s*from\s*['"]@\/features\/document['"]/, 'App must import DropZone from document feature');
    assert.match(content, /<DropZone[\s\S]*?onOpenFile=\{handleSelectFile\}[\s\S]*?\/>/, 'App must render DropZone when no document is open');
  });
});
