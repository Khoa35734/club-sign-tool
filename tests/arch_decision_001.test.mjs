import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('ARCH-DECISION-001: PDF Export Engine Evaluation Test Suite', () => {
  const decisionsPath = path.join(rootDir, 'docs', 'DECISIONS.md');
  const architecturePath = path.join(rootDir, 'docs', 'ARCHITECTURE.md');
  const roadmapPath = path.join(rootDir, 'docs', 'ROADMAP.md');
  const srsPath = path.join(rootDir, 'SRS.md');

  test('docs/DECISIONS.md and SRS.md exist and are non-empty', () => {
    assert.ok(fs.existsSync(decisionsPath), 'docs/DECISIONS.md must exist on disk');
    const stats = fs.statSync(decisionsPath);
    assert.ok(stats.size > 500, 'docs/DECISIONS.md must not be empty or placeholder text');

    assert.ok(fs.existsSync(srsPath), 'SRS.md must exist at root');
    const srsStats = fs.statSync(srsPath);
    assert.ok(srsStats.size > 1000, 'SRS.md must be a complete specification');
  });

  test('docs/DECISIONS.md contains ADR-001 matching ARCH-DECISION-001 with Accepted status', () => {
    const content = fs.readFileSync(decisionsPath, 'utf8');
    assert.match(content, /ADR-001/i, 'Must contain ADR-001 designation');
    assert.match(content, /ARCH-DECISION-001/, 'Must reference task ID ARCH-DECISION-001');
    assert.match(content, /\*\*Status:\*\*\s*\*\*Accepted\*\*/i, 'ADR status must be Accepted');
  });

  test('Evaluates all three required engines: pdf-lib, lopdf, and pdfium', () => {
    const content = fs.readFileSync(decisionsPath, 'utf8');
    assert.match(content, /pdf-lib/i, 'Must evaluate pdf-lib');
    assert.match(content, /lopdf/i, 'Must evaluate lopdf');
    assert.match(content, /pdfium/i, 'Must evaluate pdfium');
  });

  test('Cross-references and addresses critical SRS requirements', () => {
    const content = fs.readFileSync(decisionsPath, 'utf8');

    // Vector integrity (BR-009)
    assert.match(content, /BR-009/, 'Must reference BR-009 vector preservation requirement');
    assert.match(content, /rasteriz/i, 'Must address non-rasterization of entire PDF pages');

    // Export & Atomic file operations (FR-EXPORT)
    assert.match(content, /FR-EXPORT/, 'Must reference FR-EXPORT requirements');
    assert.match(content, /atomic/i, 'Must discuss atomic file output protocol');

    // Opacity / transparency blending (FR-SIG-005, FR-STAMP-004)
    assert.match(content, /FR-SIG-005|FR-STAMP-004/, 'Must reference opacity requirements');
    assert.match(content, /\/ExtGState|\/ca|\/SMask/i, 'Must analyze PDF transparency internals (ExtGState/SMask)');

    // Vietnamese diacritics / Unicode (FR-TEXT-001, FR-DATE-001)
    assert.match(content, /Vietnamese|Unicode|diacritic|fontkit/i, 'Must address Vietnamese text and font embedding');

    // Performance (NFR-PERF-005)
    assert.match(content, /NFR-PERF-005/i, 'Must address export performance SLA');

    // Offline boundary (NFR-SEC-001)
    assert.match(content, /offline|air-gapped/i, 'Must adhere to offline-first invariant');
  });

  test('Specifies clear architectural division of responsibilities (Frontend vs Native Rust)', () => {
    const content = fs.readFileSync(decisionsPath, 'utf8');
    assert.match(content, /Frontend/i, 'Must specify Frontend responsibilities');
    assert.match(content, /Rust/i, 'Must specify Backend Rust responsibilities');
    assert.match(content, /atomic_writer/i, 'Must reference atomic file writer integration');
  });

  test('Roadmap reflects ARCH-DECISION-001 completion while leaving next items pending', () => {
    assert.ok(fs.existsSync(roadmapPath), 'docs/ROADMAP.md must exist');
    const roadmap = fs.readFileSync(roadmapPath, 'utf8');

    // ARCH-DECISION-001 must be checked
    assert.match(
      roadmap,
      /- \[x\] `ARCH-DECISION-001`/,
      'ARCH-DECISION-001 must be marked [x] in docs/ROADMAP.md'
    );

    // Future milestone items must NOT be checked yet (scope protection)
    assert.match(
      roadmap,
      /- \[ \] `FR-PDF-001`/,
      'FR-PDF-001 must remain unchecked [ ]'
    );
  });

  test('System Architecture Document (docs/ARCHITECTURE.md) aligns with ADR-001 decision', () => {
    assert.ok(fs.existsSync(architecturePath), 'docs/ARCHITECTURE.md must exist');
    const arch = fs.readFileSync(architecturePath, 'utf8');
    assert.match(arch, /pdf-lib/i, 'Architecture document must specify pdf-lib export engine');
    assert.match(arch, /fontkit/i, 'Architecture document must include fontkit for text embedding');
    assert.match(arch, /atomic/i, 'Architecture document must enforce atomic file operations');
  });

  test('Enforces source file immutability guard against identical source/target path in writer contract', () => {
    const decisions = fs.readFileSync(decisionsPath, 'utf8');
    assert.match(
      decisions,
      /canonicalize\(&target_path\)\? != canonicalize\(&source_path\)\?/i,
      'Must specify canonical path check preventing overwrite of source file'
    );
    assert.match(
      decisions,
      /InvalidPath/i,
      'Must specify AppError::InvalidPath rejection on source/target collision'
    );

    const arch = fs.readFileSync(architecturePath, 'utf8');
    assert.match(
      arch,
      /canonicalize\(target\) != canonicalize\(source\)/i,
      'ARCHITECTURE.md must document source path protection invariant'
    );
  });
});

