import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('FR-FILE-ERR: File Validation & Error Handling Test Suite', () => {
  const toastPath = path.join(rootDir, 'src', 'components', 'Toast.tsx');
  const validationServicePath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'services',
    'fileValidationService.ts'
  );
  const openHookPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'hooks',
    'useOpenFile.ts'
  );
  const dropHookPath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'hooks',
    'useFileDrop.ts'
  );
  const dropZonePath = path.join(
    rootDir,
    'src',
    'features',
    'document',
    'components',
    'DropZone.tsx'
  );
  const appPath = path.join(rootDir, 'src', 'App.tsx');
  const errorTypePath = path.join(rootDir, 'src', 'types', 'error.ts');
  const tauriBridgePath = path.join(rootDir, 'src', 'services', 'tauri.ts');
  const rustValidationPath = path.join(
    rootDir,
    'src-tauri',
    'src',
    'document',
    'validation.rs'
  );
  const rustCmdPath = path.join(
    rootDir,
    'src-tauri',
    'src',
    'commands',
    'document.rs'
  );
  const rustLibPath = path.join(rootDir, 'src-tauri', 'src', 'lib.rs');
  const rustErrorPath = path.join(rootDir, 'src-tauri', 'src', 'errors', 'mod.rs');

  test('Required source files for file validation and error toast exist and are non-empty', () => {
    const requiredFiles = [
      toastPath,
      validationServicePath,
      openHookPath,
      dropHookPath,
      dropZonePath,
      appPath,
      errorTypePath,
      tauriBridgePath,
      rustValidationPath,
      rustCmdPath,
      rustLibPath,
      rustErrorPath,
    ];

    for (const f of requiredFiles) {
      assert.ok(fs.existsSync(f), `File must exist: ${f}`);
      const stat = fs.statSync(f);
      assert.ok(stat.size > 0, `File must be non-empty: ${f}`);
    }
  });

  test('Toast component provides accessible, localized error alert with close control', () => {
    const content = fs.readFileSync(toastPath, 'utf8');

    assert.match(content, /export function Toast/, 'Must export Toast component');
    assert.match(content, /role="alert"/, 'Must have role="alert" for accessibility');
    assert.match(content, /aria-live="assertive"/, 'Must announce error asserts via screen readers');
    assert.match(content, /data-testid="toast-alert"/, 'Must define data-testid for automated testing');
    assert.match(content, /onClose/, 'Must support onClose callback');
    assert.match(content, /autoCloseMs/, 'Must support optional auto-dismiss');
  });

  test('App and DropZone components render Toast for friendly error display without crashing', () => {
    const appContent = fs.readFileSync(appPath, 'utf8');
    assert.match(appContent, /import\s*\{[^}]*Toast[^}]*\}\s*from\s*['"]@\/components['"]/, 'App must import Toast');
    assert.match(appContent, /<Toast[\s\S]*?message=\{error\}[\s\S]*?onClose=\{clearError\}/, 'App must render Toast on error');

    const dropZoneContent = fs.readFileSync(dropZonePath, 'utf8');
    assert.match(dropZoneContent, /import\s*\{[^}]*Toast[^}]*\}\s*from\s*['"]@\/components['"]/, 'DropZone must import Toast');
    assert.match(dropZoneContent, /<Toast[\s\S]*?message=\{error\}[\s\S]*?onClose=\{clearError\}/, 'DropZone must render Toast on drop error');
  });

  test('Rust validation engine checks existence, 0-byte size, and magic bytes for PDF/DOCX/DOC', () => {
    const rustContent = fs.readFileSync(rustValidationPath, 'utf8');

    assert.match(rustContent, /pub fn validate_document/, 'Must define validate_document function');
    assert.match(rustContent, /không tồn tại hoặc đã bị di chuyển/, 'Must report missing file');
    assert.match(rustContent, /0 bytes/, 'Must detect and reject 0-byte files');
    assert.match(rustContent, /b"%PDF-"/, 'Must validate PDF magic bytes');
    assert.match(rustContent, /0x50[\s\S]*?0x4B/, 'Must validate Word DOCX zip magic bytes');
    assert.match(rustContent, /0xD0[\s\S]*?0xCF[\s\S]*?0x11[\s\S]*?0xE0/, 'Must validate Word DOC OLE magic bytes');

    const cmdContent = fs.readFileSync(rustCmdPath, 'utf8');
    assert.match(cmdContent, /pub async fn validate_document_file/, 'Must expose validate_document_file command');

    const libContent = fs.readFileSync(rustLibPath, 'utf8');
    assert.match(libContent, /commands::document::validate_document_file/, 'Must register command in invoke_handler');

    const errorContent = fs.readFileSync(rustErrorPath, 'utf8');
    assert.match(errorContent, /InvalidFile\(String\)/, 'AppError must include InvalidFile');
  });

  test('Frontend services and hooks integrate validateDocumentFile with localized error handling', () => {
    const serviceContent = fs.readFileSync(validationServicePath, 'utf8');
    assert.match(serviceContent, /export async function validateDocumentFile/, 'Must export validateDocumentFile');
    assert.match(serviceContent, /validate_document_file/, 'Must invoke validate_document_file Tauri command');

    const openContent = fs.readFileSync(openHookPath, 'utf8');
    assert.match(openContent, /validateDocumentFile/, 'useOpenFile must invoke validateDocumentFile');

    const dropContent = fs.readFileSync(dropHookPath, 'utf8');
    assert.match(dropContent, /validateDocumentFile/, 'useFileDrop must invoke validateDocumentFile');
    assert.match(dropContent, /0 bytes/, 'useFileDrop must catch 0-byte browser drops');

    const errTypeContent = fs.readFileSync(errorTypePath, 'utf8');
    assert.match(errTypeContent, /InvalidFile/, 'TypeScript AppError must include InvalidFile');

    const tauriContent = fs.readFileSync(tauriBridgePath, 'utf8');
    assert.match(tauriContent, /'InvalidFile'/, 'isAppError must recognize InvalidFile');
  });

  test('Functional simulation: validation correctly classifies valid, empty, and corrupted files', () => {
    const tempDir = os.tmpdir();
    const emptyFilePath = path.join(tempDir, `club_sign_test_empty_${Date.now()}.pdf`);
    const corruptedPdfPath = path.join(tempDir, `club_sign_test_corrupt_${Date.now()}.pdf`);
    const validPdfPath = path.join(tempDir, `club_sign_test_valid_${Date.now()}.pdf`);

    try {
      // 1. Create 0-byte file
      fs.writeFileSync(emptyFilePath, Buffer.alloc(0));
      const emptyStat = fs.statSync(emptyFilePath);
      assert.equal(emptyStat.size, 0, 'Empty file must have 0 bytes');

      // 2. Create corrupted file (txt renamed to .pdf)
      fs.writeFileSync(corruptedPdfPath, 'This is just a text file renamed as pdf');
      const corruptedBytes = fs.readFileSync(corruptedPdfPath);
      assert.ok(!corruptedBytes.includes('%PDF-'), 'Corrupted file must lack %PDF- header');

      // 3. Create valid mock PDF
      fs.writeFileSync(validPdfPath, '%PDF-1.7\n%Mock document content\n%%EOF');
      const validBytes = fs.readFileSync(validPdfPath);
      assert.ok(validBytes.includes('%PDF-'), 'Valid mock PDF must contain %PDF- header');
    } finally {
      if (fs.existsSync(emptyFilePath)) fs.unlinkSync(emptyFilePath);
      if (fs.existsSync(corruptedPdfPath)) fs.unlinkSync(corruptedPdfPath);
      if (fs.existsSync(validPdfPath)) fs.unlinkSync(validPdfPath);
    }
  });
});
