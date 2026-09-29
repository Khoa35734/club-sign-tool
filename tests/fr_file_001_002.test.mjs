import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('FR-FILE-001 & FR-FILE-002: Native File Picker Dialog & File Format Restrictions Test Suite', () => {
  const fileUtilsPath = path.join(rootDir, 'src', 'utils', 'file.ts');
  const storePath = path.join(rootDir, 'src', 'stores', 'useDocumentStore.ts');
  const servicePath = path.join(rootDir, 'src', 'features', 'document', 'services', 'fileDialogService.ts');
  const hookPath = path.join(rootDir, 'src', 'features', 'document', 'hooks', 'useOpenFile.ts');
  const appPath = path.join(rootDir, 'src', 'App.tsx');
  const rustDialogPath = path.join(rootDir, 'src-tauri', 'src', 'document', 'dialog.rs');
  const rustCmdPath = path.join(rootDir, 'src-tauri', 'src', 'commands', 'document.rs');
  const rustLibPath = path.join(rootDir, 'src-tauri', 'src', 'lib.rs');

  test('Required source files for file picker feature exist and are non-empty', () => {
    const requiredFiles = [
      fileUtilsPath,
      storePath,
      servicePath,
      hookPath,
      appPath,
      rustDialogPath,
      rustCmdPath,
      rustLibPath,
    ];

    for (const f of requiredFiles) {
      assert.ok(fs.existsSync(f), `File must exist: ${f}`);
      const stat = fs.statSync(f);
      assert.ok(stat.size > 0, `File must be non-empty: ${f}`);
    }
  });

  test('file.ts implements file utilities restricted to .pdf, .docx, and .doc', () => {
    const content = fs.readFileSync(fileUtilsPath, 'utf8');

    assert.match(content, /SUPPORTED_EXTENSIONS\s*:\s*readonly\s*DocumentType\[\]\s*=\s*\['pdf',\s*'docx',\s*'doc'\]/, 'Supported extensions must strictly be pdf, docx, doc');
    assert.match(content, /export function getFileName/, 'Must export getFileName function');
    assert.match(content, /export function isSupportedDocument/, 'Must export isSupportedDocument function');
    assert.match(content, /export function getDocumentType/, 'Must export getDocumentType function');
    assert.match(content, /export function createInitialDocumentMeta/, 'Must export createInitialDocumentMeta function');
  });

  test('useDocumentStore manages active document state and updates path', () => {
    const content = fs.readFileSync(storePath, 'utf8');

    assert.match(content, /export const useDocumentStore/, 'Must export useDocumentStore');
    assert.match(content, /setActiveDocument/, 'Must provide setActiveDocument action');
    assert.match(content, /setFilePath/, 'Must provide setFilePath action');
    assert.match(content, /setLoading/, 'Must provide setLoading action');
    assert.match(content, /setDirty/, 'Must provide setDirty action');
    assert.match(content, /reset/, 'Must provide reset action');
  });

  test('fileDialogService invokes native open_file_dialog Tauri command', () => {
    const content = fs.readFileSync(servicePath, 'utf8');

    assert.match(content, /safeInvoke<\s*string \| null\s*>\(\s*['"]open_file_dialog['"]\s*\)/, 'Must invoke open_file_dialog command');
    assert.match(content, /isSupportedDocument/, 'Must validate supported document formats');
  });

  test('useOpenFile hook manages dialog loading state and store update', () => {
    const content = fs.readFileSync(hookPath, 'utf8');

    assert.match(content, /export function useOpenFile/, 'Must export useOpenFile hook');
    assert.match(content, /openDocumentDialog/, 'Must invoke openDocumentDialog service');
    assert.match(content, /setFilePath/, 'Must update document store on file selection');
  });

  test('Rust native layer implements dialog with extension filter and registers command', () => {
    const dialogContent = fs.readFileSync(rustDialogPath, 'utf8');
    assert.match(dialogContent, /validate_document_extension/, 'Must define validate_document_extension');
    assert.match(dialogContent, /pick_document_file/, 'Must define pick_document_file');
    assert.match(dialogContent, /pdf/, 'Must handle pdf');
    assert.match(dialogContent, /docx/, 'Must handle docx');
    assert.match(dialogContent, /doc/, 'Must handle doc');

    const cmdContent = fs.readFileSync(rustCmdPath, 'utf8');
    assert.match(cmdContent, /#\[tauri::command\]/, 'Must declare tauri::command');
    assert.match(cmdContent, /pub async fn open_file_dialog/, 'Must define open_file_dialog command');

    const libContent = fs.readFileSync(rustLibPath, 'utf8');
    assert.match(libContent, /commands::document::open_file_dialog/, 'Must register open_file_dialog in invoke_handler');
  });

  test('App component integrates file open button and displays active document state', () => {
    const content = fs.readFileSync(appPath, 'utf8');

    assert.match(content, /useDocumentStore/, 'App must consume useDocumentStore');
    assert.match(content, /useOpenFile/, 'App must consume useOpenFile');
    assert.match(content, /Chọn tệp từ máy/, 'App must provide button to open file');
    assert.match(content, /activeDocument\.fileName/, 'App must display opened file name');
    assert.match(content, /activeDocument\.filePath/, 'App must display opened file path');
  });
});
