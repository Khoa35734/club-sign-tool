# Club Sign Tool — Development Roadmap

## Roadmap Rules

1.  **Strict Adherence to SRS:** Every functional feature must tie back to the `docs/SRS.md` specification. No unapproved features.
2.  **Granularity:** Each checkbox (`- [ ]`) represents a single, focused task suitable for one run of an AI coding agent.
3.  **No Fake Progress:** Do NOT mark an item `[x]` unless you have independently verified that the code exists, typechecks, lints, passes relevant tests, and satisfies the SRS.
4.  **Sequential Dependencies:** Phases generally run in order. Critical milestones (e.g., Coordinate Foundation, PDF Export Core) block subsequent features.
5.  **Zero Scope Creep:** Do not introduce databases, cloud services, backend APIs, or user authentication. Use local JSON and AppData only.

---

## MVP (Minimum Viable Product)

### Phase 0 — Project Foundation
- [x] `ARCH-DECISION-001` Evaluate PDF engine (pdf-lib vs lopdf/pdfium) for export capabilities against SRS requirements.
  - *Verify:* Selected approach is recorded in `docs/DECISIONS.md`.
- [x] `FR-FOUND-001` Initialize Tauri v2 + React 19 + TypeScript + Tailwind CSS project skeleton.
  - *Verify:* `npm run lint` and `cargo check` pass with zero warnings.
- [x] `FR-FOUND-002` Configure strict TypeScript (`noImplicitAny`, strict null checks) and initial project directory structure according to architecture rules.
  - *Verify:* `npx tsc --noEmit` succeeds.

### Milestone M0 — Foundation Stable
- *Acceptance:* Tauri app boots successfully to an empty window, tooling is configured, and directory structure matches `architecture.md`.

---

### Phase 1 — Local File Opening
- [x] `FR-FILE-001`, `FR-FILE-002` Implement native file picker dialog restricted to `.pdf`, `.docx`, `.doc`.
  - *Verify:* App state successfully receives the selected file path.
- [x] `FR-FILE-001` Implement Drag & Drop zone for opening files on the main window.
  - *Verify:* Dropping a `.pdf` file successfully extracts and stores the file path.
- [x] `FR-FILE-ERR` Implement file validation and friendly error handling for unreadable or 0-byte files.
  - *Verify:* Selecting a corrupted file displays a localized error toast without crashing.

---

### Phase 2 — PDF Viewer Core
- [x] `FR-PDF-001` Integrate PDF.js to load a local PDF file and extract total page count and page dimensions.
  - *Verify:* App state correctly reflects the page count and dimensions of the opened PDF.
- [x] `FR-PDF-001` Render the first PDF page onto a canvas at high resolution (min 150 DPI).
  - *Verify:* PDF page visually renders.
- [x] `FR-PDF-005` Implement vertical scrolling and multi-page rendering for the document viewport.
  - *Verify:* User can scroll through a multi-page PDF.
- [x] `FR-PDF-002`, `FR-PDF-003` Implement lazy-rendered page thumbnails sidebar.
  - *Verify:* Thumbnails load efficiently; clicking a thumbnail scrolls the main viewport to that page.
- [ ] `FR-PDF-004` Add Zoom controls (25% to 400%).
  - *Verify:* Canvas scales appropriately via buttons and `Ctrl + Scroll`.
- [ ] `FR-PDF-004`, `FR-PDF-006` Implement "Fit Page", "Fit Width", and mixed page size (Portrait/Landscape) layout support.
  - *Verify:* Different sized pages center correctly within the viewport.

### Milestone M1 — PDF Viewer Usable
- *Acceptance:* A valid PDF opens, pages render efficiently, thumbnails work, zoom works, and malformed PDFs produce recoverable errors.

---

### Phase 3 — Editor Coordinate Foundation *(CRITICAL)*
- [ ] `FR-COORD-001` Define the invariant coordinate model: Normalized coordinates (`0.0` to `1.0`).
  - *Verify:* `EditorObject` type is defined in TypeScript with `x, y, width, height` strictly documented as normalized.
- [ ] `FR-COORD-002` Implement pure conversion functions: `normalizedToScreen` and `screenToNormalized`.
  - *Verify:* Unit tests demonstrate perfect round-trip conversion at 25%, 50%, 100%, 150%, 200%, and 300% zoom levels.
- [ ] `FR-COORD-003` Implement conversion functions for Native PDF Points (72 DPI, bottom-left origin) needed for export.
  - *Verify:* Unit tests validate conversions for both Portrait and Landscape page dimensions.

---

### Phase 4 — Generic Editor Object Model
- [ ] `FR-EDITOR-BASE` Implement a transparent Konva.js stage overlaid precisely on top of the PDF canvas.
  - *Verify:* Overlay perfectly matches PDF dimensions and updates on zoom/resize.
- [ ] `FR-EDITOR-BASE` Implement rendering of a generic mock object (colored rectangle) using the normalized coordinate state.
  - *Verify:* Mock object stays pinned to the correct document location during zoom and window resize.
- [ ] `FR-EDITOR-BASE` Implement object selection, dragging, and resizing controls (Konva Transformer).
  - *Verify:* Dragging/resizing the object updates the Zustand store with new *normalized* coordinates.

### Milestone M2 — Editor Coordinate System Stable
- *Acceptance:* The mathematical foundation is proven. Objects can be placed, moved, and scaled while remaining absolutely anchored to the document regardless of zoom, DPI, or screen size.

---

### Phase 5 — Signature Assets
- [ ] `FR-LOCAL-001`, `FR-LOCAL-004` Create Asset Manager UI and local JSON store (`assets.json`) for Signatures.
  - *Verify:* `assets.json` serializes correctly to `%APPDATA%/ClubSignTool/`.
- [ ] `FR-SIG-001`, `FR-LOCAL-003` Implement signature import (PNG, JPG, SVG) and copy to local AppData storage.
  - *Verify:* Imported image is physically saved in the local AppData signatures folder.
- [ ] `FR-LOCAL-002`, `FR-LOCAL-005` Implement signature preview, rename, and deletion with confirmation.
  - *Verify:* Deleting removes the file from disk and updates JSON.
- [ ] `FR-SIG-007` Implement setting a "Default Signature".
  - *Verify:* UI visually highlights the default signature.

---

### Phase 6 — Stamp Assets
- [ ] `FR-LOCAL-001` Extend Asset Manager UI to support a "Stamps" tab.
  - *Verify:* Switching between Signatures and Stamps updates the displayed list.
- [ ] `FR-STAMP-001` Implement stamp import (PNG, JPG, SVG) to AppData.
  - *Verify:* Imported stamp is saved to the local AppData stamps folder.

---

### Phase 7 — Signature / Stamp Placement
- [ ] `FR-SIG-002`, `FR-SIG-003` Implement drag & drop of a Signature from the Asset Manager onto the PDF canvas.
  - *Verify:* Signature renders at the exact drop location on the correct page.
- [ ] `FR-SIG-004`, `FR-STAMP-005` Implement resize constraints (Lock Aspect Ratio toggle/Shift key).
  - *Verify:* Signatures and circular stamps scale without distortion.
- [ ] `FR-SIG-005`, `FR-STAMP-004` Implement opacity slider control (10% to 100%).
  - *Verify:* Object transparency updates instantly on the canvas.
- [ ] `FR-STAMP-003` Implement z-index control (Bring Forward, Send Backward) for overlapping objects.
  - *Verify:* Stamp can be placed over a signature and visually overlaps it correctly.
- [ ] `FR-SIG-006` Implement object copy, paste, duplicate (`Ctrl+D`), and delete (`Delete`) actions.
  - *Verify:* `Ctrl+D` creates an exact clone slightly offset from the original.

### Milestone M3 — Signature/Stamp Placement Usable
- *Acceptance:* Signatures and stamps can be managed, placed, scaled, layered, and deleted reliably on the canvas.

---

### Phase 8 — Undo / Redo
- [ ] `FR-EDITOR-001` Implement a bounded history state stack (Undo/Redo) for Add and Delete operations.
  - *Verify:* Pressing `Ctrl+Z` after adding an object removes it.
- [ ] `FR-EDITOR-001` Expand history stack to track Move, Resize, Rotate, and Opacity changes.
  - *Verify:* Undoing a drag operation returns the object to its previous normalized coordinates.

---

### Phase 9 — Image Editing (MVP Core)
- [ ] `FR-IMG-006` Implement local White Background Removal algorithm.
  - *Verify:* Unit tests demonstrate pure white (`#FFFFFF`) and near-white pixels are converted to transparent alpha.
- [ ] `FR-IMG-001`, `FR-IMG-002` Implement basic crop tool for signatures/stamps.
  - *Verify:* Cropped image saves correctly without aspect ratio corruption.
- [ ] `FR-IMG-007` Implement "Reset to original" to undo all image edits.
  - *Verify:* Original imported asset is restored from backup.

---

### Phase 10 — PDF Export Core *(CRITICAL)*
- [ ] `FR-EXPORT-001`, `FR-EXPORT-002` Implement basic PDF export pipeline using Rust PDF engine / `pdf-lib` for one placed signature.
  - *Verify:* Exported PDF contains the signature at the exact mapped location. Source file is completely unmodified.
- [ ] `FR-EXPORT-005` Implement Atomic File Output (write to `.tmp`, verify, rename to `*_SIGNED.pdf`).
  - *Verify:* A simulated disk write error safely deletes the `.tmp` file.
- [ ] `FR-EXPORT-003`, `FR-EXPORT-004` Expand export to support stamps, opacity blending, rotation, and multi-page documents.
  - *Verify:* Complex documents with overlapping translucent stamps export accurately.
- [ ] `FR-EXPORT-006` Implement post-export success dialog with "Open PDF" and "Open Folder" OS integrations.
  - *Verify:* Clicking "Open Folder" opens the native file explorer at the exported file's location.

### Milestone M4 — Export Pipeline Proven
- *Acceptance:* The application can reliably take an input PDF, place visual signatures and translucent stamps, and output a valid, immutable `_SIGNED.pdf` file with perfect coordinate fidelity.

---

### Phase 11 — Text Tool
- [ ] `FR-TEXT-001` Implement Text Box creation and inline typing on canvas.
  - *Verify:* User can click and type standard text (e.g., "CHỦ NHIỆM").
- [ ] `FR-TEXT-002` Implement text styling controls (Font, Size, Bold/Italic, Color, Alignment).
  - *Verify:* Text updates visually on canvas.
- [ ] `FR-EXPORT-002` Integrate text objects into the PDF Export pipeline.
  - *Verify:* Exported PDF contains embedded, searchable vector text at the correct coordinates.

---

### Phase 12 — Date Tool
- [ ] `FR-DATE-001` Implement Date Box creation with an integrated Date Picker.
  - *Verify:* User can select a date from a calendar dropdown.
- [ ] `FR-DATE-002`, `FR-DATE-003` Implement Vietnamese date string formatting and custom location prefixes.
  - *Verify:* Date renders as "Hà Nội, ngày ... tháng ... năm ...".
- [ ] `FR-EXPORT-002` Integrate date objects into the PDF Export pipeline.
  - *Verify:* Date exports correctly as vector text.

---

### Phase 14 — Word Conversion
*(Note: Placed before SHOULD HAVE items as it is critical for input handling)*
- [ ] `FR-WORD-002`, `FR-WORD-003` Implement LibreOffice headless detection and gracefully handle missing installation.
  - *Verify:* App displays a clean UI error with download instructions if `soffice.exe` is absent.
- [ ] `FR-WORD-001`, `FR-WORD-005` Implement async DOC/DOCX to PDF conversion writing to the AppData temp folder.
  - *Verify:* Original `.docx` is untouched; resulting `.pdf` loads automatically into the Viewer.
- [ ] `FR-WORD-004` Implement conversion timeout and malformed file handling.
  - *Verify:* A process exceeding 30 seconds is killed and returns an `AppError`.

### Milestone M5 — Word Conversion Integrated
- *Acceptance:* Users can seamlessly drop a `.docx` file and have it load as a PDF ready for signing.

---

### Phase 15 — Local Settings
- [ ] `FR-SETTINGS-001`, `FR-SETTINGS-002` Create Settings UI (custom LibreOffice path, default stamp opacity, export directory).
  - *Verify:* Settings are saved to and loaded from `%APPDATA%/ClubSignTool/config.json`.

---

## SHOULD HAVE (Post-MVP Core)

### Phase 9 (Extended) — Image Editing Polish
- [ ] `FR-IMG-003`, `FR-IMG-004` Implement image rotation (-180 to +180) and flip controls.
  - *Verify:* Visual transformation applies and saves correctly.
- [ ] `FR-IMG-005` Implement Brightness and Contrast sliders.
  - *Verify:* Image pixel data updates correctly.

### Phase 13 — Multi-page Operations
- [ ] `FR-EDITOR-003` Implement "Copy to selected pages" and "Apply to all pages" for signatures/stamps.
  - *Verify:* Object duplicates at exact coordinates across targeted pages, respecting mixed page dimensions.
- [ ] `FR-EDITOR-003` Add a confirmation modal before executing mass duplications.
  - *Verify:* Operation can be cancelled.

### Phase 16 — Project Save / Restore
- [ ] `FR-PROJECT-001`, `FR-PROJECT-002` Implement saving workspace state to `.clbsign` JSON format.
  - *Verify:* JSON file contains document path, editor objects, and asset references.
- [ ] `FR-PROJECT-001` Implement opening `.clbsign` files to restore sessions.
  - *Verify:* Editor fully restores if the source PDF and assets are still available on disk.

### Phase 17 — UX Polish
- [ ] `FR-EDITOR-002` Implement Smart Alignment Guides (Center X/Y snapping).
  - *Verify:* Objects snap to the page center while dragging.
- [ ] `FR-EDITOR-004` Implement object locking.
  - *Verify:* A locked object cannot be dragged, resized, or deleted.
- [ ] `FR-FILE-003`, `FR-FILE-004` Implement Recent Files list on the Home screen with broken-link cleanup.
  - *Verify:* Missing files are automatically removed from the UI list.
- [ ] `UX-POLISH` Implement keyboard shortcut mappings (`Del`, `Ctrl+C`, `Ctrl+V`, `Ctrl+S`, `Ctrl+E`).
  - *Verify:* Shortcuts trigger appropriate application behaviors.

---

## POST-MVP (Future Scope)

- [ ] Implement OCR (Optical Character Recognition) for scanned PDFs.
- [ ] Implement AI-assisted background removal (local ONNX model).
- [ ] Batch processing multiple documents with identical signatures.
- [ ] Cryptographic Digital Signing (PAdES, X.509, USB Tokens).

---

## Release Checklist & Packaging (Phase 18)

- [ ] Typecheck passes (`tsc --noEmit`).
- [ ] Lint passes (`npm run lint` & `cargo clippy`).
- [ ] Unit tests pass (Coordinate math, white removal, state).
- [ ] Integration tests pass (Export failure recovery, conversions).
- [ ] Tauri production build succeeds (`npm run tauri build`).
- [ ] PDF source-file safety verified (no writes to original file).
- [ ] Offline core workflow verified (tested with Wi-Fi disabled).
- [ ] Real PDF smoke test performed.
- [ ] DOCX conversion smoke test performed.
- [ ] No real signature/stamp assets committed to the repository.
- [ ] No network dependency required for core workflow.
- [ ] README installation instructions verified.
- [ ] Windows `.msi` / `.exe` tested on a clean machine.

### Milestone M6 — MVP Release Candidate
- *Acceptance:* The application is fully packaged, tested, safe for production use by club members, and distributed via installer.

---

## Requirement Coverage Summary

| Requirement ID | Roadmap Item / Phase | Status |
|---|---|---|
| **FR-FILE-001** | Phase 1 (File Dialog, Drag & Drop) | `[ ]` |
| **FR-FILE-002** | Phase 1 (Format restrictions) | `[ ]` |
| **FR-FILE-003** | Phase 17 (Recent files) | `[ ]` |
| **FR-FILE-004** | Phase 17 (Recent files missing logic) | `[ ]` |
| **FR-WORD-001** | Phase 14 (DOCX to PDF async) | `[ ]` |
| **FR-WORD-002** | Phase 14 (LibreOffice detection) | `[ ]` |
| **FR-WORD-003** | Phase 14 (LibreOffice missing error) | `[ ]` |
| **FR-WORD-004** | Phase 14 (Progress, Timeout, Async) | `[ ]` |
| **FR-WORD-005** | Phase 14 (Source file safety) | `[ ]` |
| **FR-PDF-001** | Phase 2 (PDF.js, render, page count) | `[ ]` |
| **FR-PDF-002** | Phase 2 (Thumbnails) | `[ ]` |
| **FR-PDF-003** | Phase 2 (Thumbnail navigation) | `[ ]` |
| **FR-PDF-004** | Phase 2 (Zoom, Fit Width/Page) | `[ ]` |
| **FR-PDF-005** | Phase 2 (Scrolling) | `[ ]` |
| **FR-PDF-006** | Phase 2 (Mixed page sizes/rotation) | `[ ]` |
| **FR-SIG-001** | Phase 5 (Signature Import) | `[ ]` |
| **FR-SIG-002** | Phase 7 (Drag to Canvas) | `[ ]` |
| **FR-SIG-003** | Phase 7 (Transform Controls) | `[ ]` |
| **FR-SIG-004** | Phase 7 (Aspect Ratio Lock) | `[ ]` |
| **FR-SIG-005** | Phase 7 (Opacity) | `[ ]` |
| **FR-SIG-006** | Phase 7 (Copy/Paste/Delete) | `[ ]` |
| **FR-SIG-007** | Phase 5 (Default Signature) | `[ ]` |
| **FR-STAMP-001** | Phase 6 (Stamp Import) | `[ ]` |
| **FR-STAMP-002** | Phase 6 (Stamp shapes) | `[ ]` |
| **FR-STAMP-003** | Phase 7 (Overlap & Z-Index) | `[ ]` |
| **FR-STAMP-004** | Phase 7 (Default opacity 85-90%) | `[ ]` |
| **FR-STAMP-005** | Phase 7 (Lock ratio 1:1) | `[ ]` |
| **FR-LOCAL-001** | Phase 5, Phase 6 (Asset Manager UI) | `[ ]` |
| **FR-LOCAL-002** | Phase 5 (Preview, rename, delete) | `[ ]` |
| **FR-LOCAL-003** | Phase 5 (Copy to AppData) | `[ ]` |
| **FR-LOCAL-004** | Phase 5 (JSON metadata store) | `[ ]` |
| **FR-LOCAL-005** | Phase 5 (Delete confirmation/file wipe) | `[ ]` |
| **FR-IMG-001** | Phase 9 (Image Editor UI) | `[ ]` |
| **FR-IMG-002** | Phase 9 (Crop) | `[ ]` |
| **FR-IMG-003** | Phase 9 Extended (Rotation) | `[ ]` |
| **FR-IMG-004** | Phase 9 Extended (Flip) | `[ ]` |
| **FR-IMG-005** | Phase 9 Extended (Brightness/Contrast)| `[ ]` |
| **FR-IMG-006** | Phase 9 (White Background Removal) | `[ ]` |
| **FR-IMG-007** | Phase 9 (Reset original) | `[ ]` |
| **FR-IMG-008** | POST-MVP (PDF Asset Extraction) | `[ ]` |
| **FR-TEXT-001** | Phase 11 (Text box insertion) | `[ ]` |
| **FR-TEXT-002** | Phase 11 (Text formatting) | `[ ]` |
| **FR-DATE-001** | Phase 12 (Date Picker) | `[ ]` |
| **FR-DATE-002** | Phase 12 (VN Date Format) | `[ ]` |
| **FR-DATE-003** | Phase 12 (Location prefix) | `[ ]` |
| **FR-EDITOR-001**| Phase 8 (Undo/Redo History) | `[ ]` |
| **FR-EDITOR-002**| Phase 17 (Snapping guides) | `[ ]` |
| **FR-EDITOR-003**| Phase 13 (Multi-page apply) | `[ ]` |
| **FR-EDITOR-004**| Phase 17 (Object locking) | `[ ]` |
| **FR-PROJECT-001**| Phase 16 (Save/Open Project) | `[ ]` |
| **FR-PROJECT-002**| Phase 16 (JSON Project format) | `[ ]` |
| **FR-EXPORT-001**| Phase 10 (Export Preview Dialog) | `[ ]` |
| **FR-EXPORT-002**| Phase 10 (PDF Engine export) | `[ ]` |
| **FR-EXPORT-003**| Phase 10 (Vector text & quality) | `[ ]` |
| **FR-EXPORT-004**| Phase 10 (Export naming) | `[ ]` |
| **FR-EXPORT-005**| Phase 10 (Atomic File Output) | `[ ]` |
| **FR-EXPORT-006**| Phase 10 (Post-export actions) | `[ ]` |
| **FR-SETTINGS-001**| Phase 15 (Settings UI) | `[ ]` |
| **FR-SETTINGS-002**| Phase 15 (Settings JSON storage) | `[ ]` |
