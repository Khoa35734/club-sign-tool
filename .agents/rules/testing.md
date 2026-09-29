---
trigger: model_decision
description: "Testing methodology, verification workflows, test coverage priorities, and test fixture rules."
---

# Testing Strategy & Quality Assurance

## 1. Testing Philosophy for Solo Development
- **Focus on Invariants & Calculations:** Prioritize testing mathematical calculations, boundary conditions, data transformations, and safety mechanisms.
- **Avoid Fragile UI Tests:** Do not write brittle tests that assert on specific DOM structures, CSS classes, or internal component hierarchies. Test observable behaviors and business logic contracts.
- **Deterministic & Offline:** All tests must run 100% offline with zero external network access, completing in under 30 seconds for the entire test suite.

---

## 2. Priority Test Coverage Matrix

### A. Coordinate Transformation & Invariance (Critical)
- **Mathematical Invertibility:** Unit test coordinate conversions between Normalized Space (`0.0–1.0`), Screen Canvas Space, and Native PDF Space (72 DPI, bottom-left origin).
  - Verify that: `screenToNormalized(normalizedToScreen(coord, zoom), zoom) ≈ coord` across zoom levels (25%, 50%, 100%, 150%, 200%, 300%).
  - Verify that display scaling factors (`devicePixelRatio` 1.0, 1.25, 1.5, 2.0) do not displace placed objects relative to the page.

### B. Atomic Export & Original File Preservation (Critical)
- **Checksum Invariance:** Verify that the SHA-256 hash of the input document (`.pdf` or `.docx`) remains identical before and after any export operation.
- **Failure Recovery:** Simulate export failures (write permission denied, disk full) and assert that:
  - All `.tmp_*` files are removed.
  - The original file is not touched.
  - A typed error is returned to the caller.
- **Filename Collision:** Test automatic target name generation when `filename_SIGNED.pdf` already exists, ensuring it increments safely to `filename_SIGNED (1).pdf`.

### C. Undo / Redo Command Engine
- Test stack transitions across sequences: `Add -> Move -> Resize -> Undo -> Undo -> Redo`.
- Verify that pushing a new action after an `Undo` clears the forward `Redo` stack.
- Verify that the undo stack enforces a strict capacity limit (e.g., 50 entries) without memory leak.

### D. Image Background Removal & Transformation
- **Thresholding Tests:** Test the white background removal algorithm against pure white (`#FFFFFF`), near-white (`#F8F9FA`), off-white paper scans, and pre-existing transparent alpha channels.
- **Dimension & Aspect Ratio:** Assert that crop, scale, and rotate operations preserve aspect ratio constraints when locked by the user.

### E. LibreOffice Headless Subprocess Handling
- Mock/test subprocess edge cases:
  - Missing executable returns `AppError::LibreOfficeNotFound`.
  - Long-running execution triggers process kill and timeout error.
  - Non-zero process exit codes produce descriptive diagnostic messages without leaking raw memory or crashing.
  - Corrupt Word document input returns a clean validation error.

---

## 3. Test Fixture Standards
- **Synthetic Assets Only:** Store test assets under `tests/fixtures/`.
- **Tiny Payloads:** Keep sample PDFs small (1–3 pages, vector text, < 500 KB) to ensure rapid test execution.
- **Watermarked Mock Signatures:** All test signatures and stamps must be synthetically generated placeholder graphics with text such as `"SAMPLE SIGNATURE - TEST FIXTURE"`. Never commit real signatures.

---

## 4. Standard Verification Commands
When verifying code before completing a task, run:
```bash
# Frontend type check & test suite
npx tsc --noEmit
npm run lint
npm test

# Rust backend tests & linting
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```
