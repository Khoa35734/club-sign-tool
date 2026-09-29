# Architecture Decision Records (ADR) — Club Sign Tool

This document records the architectural and technology decisions made for **Club Sign Tool**, cross-referenced against the Software Requirements Specification (`docs/SRS.md`) and project rules.

---

## ADR-001: PDF Export Engine Selection (pdf-lib vs. lopdf vs. pdfium)

- **ID:** `ARCH-DECISION-001`
- **Status:** **Accepted**
- **Date:** 2026-09-29
- **Deciders:** Lead Architect & Solo Developer
- **Relevant SRS Requirements:**
  - `BR-009` (Tính Toàn vẹn Vector): Preservation of original vector layers and searchable text; zero full-page rasterization.
  - `FR-EXPORT-001` – `FR-EXPORT-006`: Accurate coordinate placement, original image resolution, atomic file writing (`.tmp` -> verify -> rename), and OS file integration.
  - `FR-SIG-005` & `FR-STAMP-004`: Alpha transparency / Opacity slider (10% to 100%) and layer blending for official seals overlapping signatures (Nghị định 30/2020/NĐ-CP).
  - `FR-TEXT-001` & `FR-DATE-001`: Vietnamese Unicode text rendering (diacritics support) for signer name, title, and administrative dates.
  - `NFR-PERF-005`: Export duration for a 10-page document with 2 placed images must execute in < 3.0 seconds.
  - `NFR-SEC-001`: 100% offline air-gapped execution with zero remote dependencies or telemetry.

---

### 1. Context & Problem Statement

Club Sign Tool allows university student club officers to place visual signatures (transparent PNGs), official club stamps (translucent PNGs with opacity blending), and administrative text (signer name, title, date) onto documents and export a pristine, publication-grade `_SIGNED.pdf`.

A core non-negotiable requirement (`BR-009`) is that **the original PDF content must remain 100% vector**:
- Existing text must remain selectable and searchable.
- Page geometry, media boxes, vector tables, and lines must not be degraded.
- The system must **never** rasterize entire PDF pages into bitmap images to stamp them.

Furthermore, official Vietnamese administrative conventions (Nghị định 30/2020/NĐ-CP) mandate placing the stamp overlapping the signature (typically overlapping ~1/3 of the signature on the left side) with opacity (85%–90%), requiring proper PDF transparency graphics state (`/ExtGState` with `/ca` non-stroking alpha and soft masks `/SMask` for PNG alpha channels).

We need to choose the PDF engine for loading an existing PDF, embedding transparent image/text overlay objects, and generating the final output bytes.

---

### 2. Candidate Evaluation

Three candidate approaches were evaluated:

#### Candidate A: `pdf-lib` (+ `@pdf-lib/fontkit`) (Frontend TypeScript / Web Worker)
- **Architecture:** Pure JavaScript/TypeScript PDF manipulation library running in the WebView2 engine.
- **Capabilities:**
  - `PDFDocument.load(bytes)` parses existing PDFs without altering existing page streams or vector text (`BR-009`).
  - `embedPng(pngBytes)` natively handles RGBA PNGs, separating RGB image data and 8-bit alpha channels into an `/SMask` PDF soft-mask dictionary.
  - `page.drawImage(..., { opacity, rotate, ... })` automatically generates and references `/ExtGState` graphics states with non-stroking alpha (`/ca`).
  - Supports TrueType/OpenType font embedding via `@pdf-lib/fontkit` for full Vietnamese diacritics support (`FR-TEXT-001`).
  - Extremely lightweight: pure npm dependency, zero native C++ binaries, zero platform-specific compilation hurdles.
  - Fast execution: generates and serializes a 10-page signed PDF in ~150–300 ms (well within `NFR-PERF-005`'s 3-second limit).
- **Limitations:**
  - Operates inside the frontend JS runtime (WebView2), transferring final `Uint8Array` bytes to Rust via Tauri IPC for atomic file operations.

#### Candidate B: `lopdf` (Rust Native Core)
- **Architecture:** Pure Rust low-level PDF document and object-tree parser/writer.
- **Capabilities:**
  - 100% Rust, compiles directly into the native binary with zero C/C++ dynamic libraries.
  - Fast and memory-efficient.
  - Does not rasterize; preserves vector text.
- **Limitations:**
  - `lopdf` is a low-level object-tree manipulator, **not** a high-level graphics or layout engine.
  - It does **not** provide high-level drawing primitives (`drawImage`, `drawText`).
  - To embed a transparent PNG with custom opacity in `lopdf`, the solo developer would have to manually implement:
    1. Parsing PNG RGBA chunks and extracting color vs. alpha mask channels.
    2. Constructing `/XObject` dictionaries for the base image and `/SMask` soft mask.
    3. Generating `/ExtGState` dictionaries with `/ca` and `/CA` entries in page `/Resources`.
    4. Appending raw PDF stream operators (`q`, `cm`, `/GS1 gs`, `/Im1 Do`, `Q`) to page `/Contents`.
    5. Handling complex cases where `/Contents` is an array of object streams or object streams with compression.
    6. Writing a custom TrueType font parser, CMap `/ToUnicode` generator, and glyph subsetter from scratch to support Vietnamese Unicode text.
  - **Verdict for Solo Developer:** Enormous implementation and maintenance burden with a high risk of producing corrupt PDF streams for third-party PDF readers.

#### Candidate C: `pdfium` / `pdfium-render` (C++ via Rust FFI)
- **Architecture:** Google's battle-tested Chromium PDF engine (C++) accessed via Rust bindings.
- **Capabilities:**
  - Industry-standard PDF engine with comprehensive page object editing, image embedding, and vector preservation.
- **Limitations:**
  - Heavy binary footprint: requires bundling a precompiled `pdfium.dll` (~15–30 MB) with the Windows installer.
  - Build & Distribution Complexity: DLL path resolution, potential antivirus/Defender false positives, and complex cross-compilation.
  - Redundancy: The app already uses `PDF.js` for document viewing in the frontend. Embedding a full C++ PDFium runtime exclusively for export adds massive bloat.

---

### 3. Comparison Matrix

| Evaluation Criterion | Candidate A: `pdf-lib` (+ fontkit) | Candidate B: `lopdf` (Rust) | Candidate C: `pdfium` (C++/Rust) |
|---|---|---|---|
| **Vector & Searchable Text Preservation (`BR-009`)** | **High** (Native vector preservation) | **High** (Object tree preserved) | **High** (Native vector preservation) |
| **PNG Alpha & Transparency Blending (`FR-STAMP-004`)** | **High** (Built-in `/SMask` & `/ExtGState`) | **Very Low** (Requires custom ISO 32000-1 engine) | **High** (Full graphics state support) |
| **Vietnamese Diacritics / Unicode Text (`FR-TEXT`)** | **High** (via `@pdf-lib/fontkit`) | **Very Low** (Requires custom CMap & font parser) | **Medium** (Requires system font loading) |
| **Performance (`NFR-PERF-005` < 3s)** | **High** (~150–300 ms for 10 pages) | **Highest** (~50–100 ms) | **High** (~100–200 ms) |
| **Binary Footprint Bloat** | **Zero** (Pure JS in webview bundle) | **Zero** (Pure Rust static link) | **High** (+15 to 30 MB native DLL) |
| **Build & Distribution Complexity** | **Very Low** (Standard npm package) | **Low** (Cargo crate) | **High** (External DLL management) |
| **Solo Developer Maintenance Risk** | **Very Low** (Mature, documented APIs) | **Extreme** (Fragile custom PDF writer) | **Medium** (FFI lifecycle & memory safety) |

---

### 4. Architectural Decision

**Decision:** We select **Candidate A (`pdf-lib` + `@pdf-lib/fontkit`) in the Frontend**, orchestrated with **Rust Native Safe File Operations (`src-tauri/src/filesystem/atomic_writer.rs`)** across the Tauri IPC boundary.

#### Division of Responsibilities:
1. **Frontend (`src/features/export/services/pdfExportService.ts`):**
   - Loads original PDF bytes into a `pdf-lib` `PDFDocument`.
   - Reads placed canvas objects from `useEditorStore` (normalized coordinates `0.0`–`1.0`).
   - Converts normalized coordinates to Native PDF Points (72 DPI, bottom-left origin):
     $$\text{pdfX} = x_{\text{norm}} \times \text{pageWidth}$$
     $$\text{pdfY} = (1.0 - y_{\text{norm}} - h_{\text{norm}}) \times \text{pageHeight}$$
   - Embeds signature and stamp PNG images at native resolution with exact rotation and `/ca` opacity.
   - Embeds administrative text (signer name, title, date) with embedded TrueType font (`Times New Roman` / `Roboto`) via `@pdf-lib/fontkit`.
   - Serializes final document to `Uint8Array`.
2. **Backend Rust Core (`src-tauri/src/filesystem/atomic_writer.rs`):**
   - Receives byte buffer, source path, and target path via `export_signed_pdf` Tauri IPC command.
   - **Source File Immutability Guard:** Strictly verifies that `canonicalize(&target_path)? != canonicalize(&source_path)?`. If target equals source, immediately returns `Err(AppError::InvalidPath("Target path cannot be identical to source path".into()))` to guarantee the original document is never mutated or overwritten.
   - Executes the 4-step Atomic File Protocol (`SRS.md` Section 17.1):
     1. Writes to `.tmp.[uuid]` file.
     2. Validates integrity (file size > 0, header starts with `%PDF-`, trailer contains `%%EOF`).
     3. Atomically moves/renames `.tmp` to `[Original]_SIGNED.pdf` (or resolves collision `_SIGNED (1).pdf`).
     4. On failure, immediately deletes `.tmp` and ensures original files are never mutated.
   - Exposes OS helper commands: `open_signed_pdf` (default Windows reader) and `open_containing_folder` (Windows Explorer).

---

### 5. Consequences & Risk Mitigation

- **Large Documents Memory Management:** Documents with 500+ pages could increase JS heap usage.
  - *Mitigation:* Club documents (proposals, event plans) typically range from 2 to 30 pages. In addition, `pdf-lib` loads object streams on demand, keeping memory footprint below 60 MB for typical documents.
- **IPC Data Transfer:** Passing `Uint8Array` across Tauri v2 IPC.
  - *Mitigation:* Tauri v2 implements zero-copy binary transfer for typed byte arrays via raw IPC buffers, eliminating JSON base64 serialization overhead.
- **Page Rotation Handling (`/Rotate 90/180/270`):** Pages with internal rotation tags (`FR-PDF-006`) require coordinate compensation.
  - *Mitigation:* The export service inspects `page.getRotation().angle` and transforms coordinates and object rotation relative to the visual orientation displayed to the user.
- **Offline Font Asset Licensing:** Proprietary fonts (e.g. Times New Roman) cannot be bundled.
  - *Mitigation:* Bundle open fonts under the SIL Open Font License (e.g., `Roboto-Regular.ttf` / `NotoSerif-Regular.ttf`) within the local desktop asset bundle to guarantee 100% offline Vietnamese diacritics rendering without external font downloads.
- **Future Extensibility (Cryptographic PAdES Signatures):**
  - Should future versions introduce PKI/X.509 cryptographic signing, the final exported PDF can be passed to a native Rust crypto crate (`pades` / `rcgen` / `openssl`) to append digital signature dictionaries without modifying this visual layout pipeline.
