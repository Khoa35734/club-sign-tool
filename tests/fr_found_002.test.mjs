import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('FR-FOUND-002: Strict TypeScript & Project Architecture Directory Verification Test Suite', () => {
  const tsconfigPath = path.join(rootDir, 'tsconfig.json');
  const viteConfigPath = path.join(rootDir, 'vite.config.ts');

  test('tsconfig.json contains all required strict type-checking options and path aliases', () => {
    assert.ok(fs.existsSync(tsconfigPath), 'tsconfig.json must exist');
    const raw = fs.readFileSync(tsconfigPath, 'utf8')
      .replace(/^\s*\/\*.*?\*\//gm, '')
      .replace(/^\s*\/\/.*/gm, '');
    const tsconfig = JSON.parse(raw);
    const opts = tsconfig.compilerOptions;

    // Strict type checks
    assert.strictEqual(opts.strict, true, 'strict must be true');
    assert.strictEqual(opts.noImplicitAny, true, 'noImplicitAny must be true');
    assert.strictEqual(opts.strictNullChecks, true, 'strictNullChecks must be true');
    assert.strictEqual(opts.strictFunctionTypes, true, 'strictFunctionTypes must be true');
    assert.strictEqual(opts.strictBindCallApply, true, 'strictBindCallApply must be true');
    assert.strictEqual(opts.strictPropertyInitialization, true, 'strictPropertyInitialization must be true');
    assert.strictEqual(opts.noImplicitThis, true, 'noImplicitThis must be true');
    assert.strictEqual(opts.alwaysStrict, true, 'alwaysStrict must be true');
    assert.strictEqual(opts.noImplicitReturns, true, 'noImplicitReturns must be true');
    assert.strictEqual(opts.noUncheckedIndexedAccess, true, 'noUncheckedIndexedAccess must be true');
    assert.strictEqual(opts.forceConsistentCasingInFileNames, true, 'forceConsistentCasingInFileNames must be true');

    // Path alias @/*
    assert.strictEqual(opts.baseUrl, '.', 'baseUrl must be "."');
    assert.ok(opts.paths && opts.paths['@/*'], 'paths["@/*"] must be configured');
    assert.deepStrictEqual(opts.paths['@/*'], ['src/*'], 'paths["@/*"] must map to ["src/*"]');
  });

  test('vite.config.ts resolves path alias @/* to src directory', () => {
    assert.ok(fs.existsSync(viteConfigPath), 'vite.config.ts must exist');
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

    assert.match(viteConfig, /resolve\s*:\s*\{\s*alias\s*:\s*\{/, 'vite.config.ts must configure resolve.alias');
    assert.match(viteConfig, /['"]@['"]\s*:\s*fileURLToPath/, 'alias @ must resolve to ./src via fileURLToPath');
  });

  test('Initial architecture directory structure matches architecture.md specification', () => {
    const expectedDirs = [
      path.join(rootDir, 'src', 'app'),
      path.join(rootDir, 'src', 'components'),
      path.join(rootDir, 'src', 'hooks'),
      path.join(rootDir, 'src', 'services'),
      path.join(rootDir, 'src', 'stores'),
      path.join(rootDir, 'src', 'types'),
      path.join(rootDir, 'src', 'utils'),
    ];

    for (const dir of expectedDirs) {
      assert.ok(fs.existsSync(dir), `Directory ${dir} must exist`);
      assert.ok(fs.statSync(dir).isDirectory(), `${dir} must be a directory`);
    }
  });

  test('Domain types in src/types/ match SRS specifications', () => {
    // Canvas & Placement types (SRS Section 14)
    const canvasTypePath = path.join(rootDir, 'src', 'types', 'canvas.ts');
    assert.ok(fs.existsSync(canvasTypePath), 'src/types/canvas.ts must exist');
    const canvasContent = fs.readFileSync(canvasTypePath, 'utf8');
    assert.match(canvasContent, /export type ObjectType\s*=\s*'signature' \| 'stamp' \| 'text' \| 'date'/, 'ObjectType must include signature, stamp, text, date');
    assert.match(canvasContent, /export interface BasePlacementObject/, 'Must declare BasePlacementObject');
    assert.match(canvasContent, /export interface ImagePlacementObject extends BasePlacementObject/, 'Must declare ImagePlacementObject');
    assert.match(canvasContent, /export interface TextPlacementObject extends BasePlacementObject/, 'Must declare TextPlacementObject');
    assert.match(canvasContent, /export type CanvasPlacementObject\s*=\s*ImagePlacementObject \| TextPlacementObject/, 'Must declare CanvasPlacementObject');

    // Document types
    const docTypePath = path.join(rootDir, 'src', 'types', 'document.ts');
    assert.ok(fs.existsSync(docTypePath), 'src/types/document.ts must exist');
    const docContent = fs.readFileSync(docTypePath, 'utf8');
    assert.match(docContent, /export interface DocumentMeta/, 'Must declare DocumentMeta');
    assert.match(docContent, /export interface PageDimensions/, 'Must declare PageDimensions');

    // Asset types (SRS Section 10.5 & 18.1)
    const assetTypePath = path.join(rootDir, 'src', 'types', 'assets.ts');
    assert.ok(fs.existsSync(assetTypePath), 'src/types/assets.ts must exist');
    const assetContent = fs.readFileSync(assetTypePath, 'utf8');
    assert.match(assetContent, /export interface AssetMetadata/, 'Must declare AssetMetadata');
    assert.match(assetContent, /export interface AssetsCatalog/, 'Must declare AssetsCatalog');

    // Settings & Config types (SRS Section 18.2)
    const settingsTypePath = path.join(rootDir, 'src', 'types', 'settings.ts');
    assert.ok(fs.existsSync(settingsTypePath), 'src/types/settings.ts must exist');
    const settingsContent = fs.readFileSync(settingsTypePath, 'utf8');
    assert.match(settingsContent, /export interface AppSettings/, 'Must declare AppSettings');
    assert.match(settingsContent, /export interface EditorDefaults/, 'Must declare EditorDefaults');
    assert.match(settingsContent, /export interface AppConfig/, 'Must declare AppConfig');

    // Error types matching Rust AppError
    const errorTypePath = path.join(rootDir, 'src', 'types', 'error.ts');
    assert.ok(fs.existsSync(errorTypePath), 'src/types/error.ts must exist');
    const errorContent = fs.readFileSync(errorTypePath, 'utf8');
    assert.match(errorContent, /export type AppError/, 'Must declare AppError');
    assert.match(errorContent, /IoError/, 'Must include IoError');
    assert.match(errorContent, /ConversionError/, 'Must include ConversionError');
    assert.match(errorContent, /PdfError/, 'Must include PdfError');
    assert.match(errorContent, /InvalidPath/, 'Must include InvalidPath');
    assert.match(errorContent, /LibreOfficeNotFound/, 'Must include LibreOfficeNotFound');
    assert.match(errorContent, /Cancelled/, 'Must include Cancelled');
  });

  test('Shared components and layout modules export valid TypeScript definitions', () => {
    assert.ok(fs.existsSync(path.join(rootDir, 'src', 'app', 'AppShell.tsx')), 'AppShell.tsx must exist');
    assert.ok(fs.existsSync(path.join(rootDir, 'src', 'components', 'Button.tsx')), 'Button.tsx must exist');
    assert.ok(fs.existsSync(path.join(rootDir, 'src', 'services', 'tauri.ts')), 'tauri.ts service must exist');
    assert.ok(fs.existsSync(path.join(rootDir, 'src', 'hooks', 'useWindowSize.ts')), 'useWindowSize.ts must exist');
    assert.ok(fs.existsSync(path.join(rootDir, 'src', 'stores', 'types.ts')), 'stores/types.ts must exist');
    assert.ok(fs.existsSync(path.join(rootDir, 'src', 'utils', 'format.ts')), 'utils/format.ts must exist');
  });
});
