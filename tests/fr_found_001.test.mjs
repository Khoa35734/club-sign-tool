import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('FR-FOUND-001: Project Skeleton Verification Test Suite', () => {
  test('Root frontend files exist and configure React 19 + TypeScript + Tailwind CSS', () => {
    const pkgPath = path.join(rootDir, 'package.json');
    assert.ok(fs.existsSync(pkgPath), 'package.json must exist');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    // React 19 check
    assert.ok(pkg.dependencies.react.includes('19'), 'React dependency must be version 19');
    assert.ok(pkg.dependencies['react-dom'].includes('19'), 'React-DOM dependency must be version 19');

    // Tailwind check
    assert.ok(pkg.dependencies.tailwindcss, 'Tailwind CSS must be installed');

    // Scripts check
    assert.ok(pkg.scripts.lint, 'Lint script must exist');
    assert.ok(pkg.scripts.build, 'Build script must exist');
    assert.ok(pkg.scripts.test, 'Test script must exist');

    // Config files
    assert.ok(fs.existsSync(path.join(rootDir, 'vite.config.ts')), 'vite.config.ts must exist');
    assert.ok(fs.existsSync(path.join(rootDir, 'tsconfig.json')), 'tsconfig.json must exist');
    assert.ok(fs.existsSync(path.join(rootDir, 'eslint.config.js')), 'eslint.config.js must exist');
    assert.ok(fs.existsSync(path.join(rootDir, 'index.html')), 'index.html must exist');
  });

  test('Tauri v2 native skeleton exists with required modules and configuration', () => {
    const cargoPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');
    assert.ok(fs.existsSync(cargoPath), 'src-tauri/Cargo.toml must exist');
    const cargo = fs.readFileSync(cargoPath, 'utf8');

    assert.match(cargo, /name\s*=\s*"club-sign-tool"/, 'Cargo package name must be club-sign-tool');
    assert.match(cargo, /tauri\s*=\s*\{\s*version\s*=\s*"2"/, 'Must use Tauri v2');

    const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
    assert.ok(fs.existsSync(tauriConfPath), 'tauri.conf.json must exist');
    const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
    assert.strictEqual(tauriConf.productName, 'Club Sign Tool', 'Product name must be Club Sign Tool');

    // Rust source structure
    assert.ok(fs.existsSync(path.join(rootDir, 'src-tauri', 'src', 'main.rs')), 'main.rs must exist');
    assert.ok(fs.existsSync(path.join(rootDir, 'src-tauri', 'src', 'lib.rs')), 'lib.rs must exist');
    assert.ok(fs.existsSync(path.join(rootDir, 'src-tauri', 'src', 'errors', 'mod.rs')), 'errors/mod.rs must exist');
    assert.ok(fs.existsSync(path.join(rootDir, 'src-tauri', 'src', 'commands', 'mod.rs')), 'commands/mod.rs must exist');
    assert.ok(fs.existsSync(path.join(rootDir, 'src-tauri', 'src', 'filesystem', 'mod.rs')), 'filesystem/mod.rs must exist');
  });

  test('AppError is strictly typed according to Tauri & Rust engineering standards', () => {
    const errorModPath = path.join(rootDir, 'src-tauri', 'src', 'errors', 'mod.rs');
    const content = fs.readFileSync(errorModPath, 'utf8');

    assert.match(content, /enum AppError/, 'Must declare AppError enum');
    assert.match(content, /IoError/, 'Must include IoError variant');
    assert.match(content, /ConversionError/, 'Must include ConversionError variant');
    assert.match(content, /PdfError/, 'Must include PdfError variant');
    assert.match(content, /InvalidPath/, 'Must include InvalidPath variant');
    assert.match(content, /LibreOfficeNotFound/, 'Must include LibreOfficeNotFound variant');
    assert.match(content, /Cancelled/, 'Must include Cancelled variant');
  });

  test('React App component renders with Tailwind CSS and offline badge', () => {
    const appPath = path.join(rootDir, 'src', 'App.tsx');
    assert.ok(fs.existsSync(appPath), 'src/App.tsx must exist');
    const content = fs.readFileSync(appPath, 'utf8');

    assert.match(content, /Club Sign Tool/, 'Must render application title');
    assert.match(content, /Air-Gapped/i, 'Must display offline/air-gapped indicator');
  });
});
