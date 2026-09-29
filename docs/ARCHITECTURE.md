# Club Sign Tool — System Architecture Document

## 1. System Overview & Product Boundary
**Club Sign Tool** is a local-first, offline desktop utility built with **Tauri v2**, **React 19**, **TypeScript**, and **Rust**. It enables university student club officers to open documents (PDF, DOC, DOCX), place visual signatures and official stamps with accurate coordinates, adjust transparency, and export high-fidelity signed PDF documents with atomic file-safety guarantees.

### 1.1 Strict Scope Invariant (Zero-Infrastructure)
The application operates under strict local/offline-first boundaries:
- **No Remote Servers or APIs:** No REST, GraphQL, tRPC, WebSockets, or HTTP/HTTPS endpoints.
- **No Database:** No SQLite, PostgreSQL, MySQL, Redis, or LevelDB.
- **No Cloud Services:** No AWS S3, MinIO, Firebase, Supabase, or Google Drive integrations.
- **No User Accounts:** No login, passwords, JWT, or multi-tenant permission layers.
- **Pure Local Persistence:** Configuration, recent files, and saved asset metadata reside exclusively in standard `%APPDATA%/ClubSignTool/` JSON files (`config.json`, `assets.json`).

---

## 2. Technology Stack

| Layer | Component | Selected Technology | Rationale |
|---|---|---|---|
| **Desktop Shell** | Runtime & Native Bridge | Tauri v2 (Rust + Microsoft Edge WebView2) | Ultra-lightweight footprint (< 15 MB), native security sandbox, native Windows I/O. |
| **Frontend Framework** | UI & View Layer | React 19 + TypeScript (Strict Mode) | Predictable functional components, robust type safety, zero `any` policy. |
| **Styling** | Component Design | Tailwind CSS | Fast utility styling, responsive layout for varied monitor resolutions. |
| **Document Viewer** | PDF Rendering | PDF.js | High-performance, multi-page canvas rasterization and thumbnail generation in WebView2. |
| **Interactive Editor** | Overlay Canvas | Konva.js / React-Konva | High-framerate (60 FPS) canvas manipulation (drag, resize, rotate, Z-index, snap). |
| **State Management** | Global Client State | Zustand | Minimal, immutable, boilerplate-free store architecture. |
| **PDF Export Engine** | PDF Assembly & Object Stitching | `pdf-lib` + `@pdf-lib/fontkit` (Frontend) | Pure vector preservation (`BR-009`), native PNG alpha `/SMask`, ExtGState `/ca` opacity, UTF-8 font embedding. |
| **Safe File Operations** | Atomic Writer & Temp Cleaner | Rust Native (`std::fs`) | Atomic rename protocol, integrity verification, absolute protection of original files. |
| **Word Conversion** | Headless DOC/DOCX Conversion | Local LibreOffice Headless CLI (`soffice.exe`) | High-fidelity table/break/layout preservation, local air-gapped conversion. |
| **Image Processing** | Background Removal & Crop | Rust Native (`image` crate) / Canvas 2D | Fast white background removal (< 100ms) with thresholding and alpha generation. |

---

## 3. High-Level System Layers

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CLUB SIGN TOOL (DESKTOP)                        │
├────────────────────────────────────────────────────────────────────────┤
│  [PRESENTATION LAYER - React 19 + TypeScript + Tailwind CSS]            │
│  - App Shell & Navigation (Home, Editor, Asset Library, Image Editor)   │
│  - PDF Viewer Canvas (PDF.js lazy rendering + thumbnail sidebar)       │
│  - Interactive Overlay (Konva.js Stage: transforms, rotation, opacity) │
│  - Properties Panel, Export Modal, Settings Modal                      │
├────────────────────────────────────────────────────────────────────────┤
│  [APPLICATION STATE & DOMAIN LAYER - Zustand Stores & Services]         │
│  - useDocumentStore: Active document, pages, dimensions, dirty state   │
│  - useEditorStore: Normalized objects, selection, zoom, undo/redo stack│
│  - useAssetStore: Signatures & stamps metadata, recent assets          │
│  - useSettingsStore: LibreOffice path, default opacities, output dir   │
│  - Coordinate Engine: Normalized ↔ Screen ↔ PDF Points conversions      │
├────────────────────────────────────────────────────────────────────────┤
│  [TAURI INTERPROCESS COMMUNICATION (IPC) BRIDGE]                       │
│  - Typed Tauri commands (invoke) with Result<T, AppError> return types │
├────────────────────────────────────────────────────────────────────────┤
│  [NATIVE BACKEND LAYER - Rust Core (src-tauri)]                        │
│  - commands/: Thin controllers validating payloads and dispatching     │
│  - filesystem/: Atomic file writer, AppData manager, temp cleaner     │
│  - conversion/: LibreOffice process manager (timeout, isolation)       │
│  - image/: Pixel manipulation, white background removal, cropping      │
│  - errors/: Centralized AppError enum with structured serialization    │
└────────────────────────────────────────────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌───────────────────────────────────┐               ┌────────────────────┐
│ Local File System (Air-Gapped)    │               │ External Tool      │
│ - Source Documents (Read-Only)    │               │ - LibreOffice      │
│ - %APPDATA%/ClubSignTool/         │               │   (soffice.exe)    │
│   ├── config.json, assets.json    │               └────────────────────┘
│   └── assets/ (signatures, stamps)│
│ - Target Signed PDFs (Atomic)     │
└───────────────────────────────────┘
```

---

## 4. Directory Layout Standards (Feature-Sliced Structure)

```text
club-sign-tool/
├── docs/                                 # Architectural, roadmap, and specification documents
│   ├── SRS.md                            # Software Requirements Specification (canonical)
│   ├── ARCHITECTURE.md                   # System Architecture (this document)
│   ├── DECISIONS.md                      # Architecture Decision Records (ADRs)
│   ├── ROADMAP.md                        # Step-by-step phased development roadmap
│   └── ANTIGRAVITY.md                    # Antigravity CLI workflows and guidelines
├── src/                                  # Frontend Application (React 19 + TypeScript)
│   ├── app/                              # Application root, providers, layout shell
│   ├── components/                       # Shared design system components (Button, Modal, Toast)
│   ├── features/                         # Feature-sliced modules
│   │   ├── document/                     # File loader, drag-and-drop, page thumbnail strip
│   │   ├── editor/                       # Canvas overlay, Konva transformers, zoom/pan
│   │   ├── signature/                    # Signature asset picker, drag-to-canvas
│   │   ├── stamp/                        # Stamp asset picker, opacity slider, z-index layering
│   │   ├── image-editor/                 # White background removal, crop, rotation
│   │   ├── word-conversion/              # LibreOffice conversion status and triggers
│   │   ├── export/                       # Export preview modal, atomic save trigger
│   │   └── settings/                     # App settings, LibreOffice path configuration
│   ├── hooks/                            # Cross-cutting hooks (useKeyboardShortcuts, useResize)
│   ├── services/                         # Tauri IPC client wrappers, AppData filesystem helpers
│   ├── stores/                           # Global Zustand stores (useDocumentStore, useEditorStore)
│   ├── types/                            # Core domain interfaces (EditorObject, DocumentMeta)
│   └── utils/                            # Pure coordinate math and PDF transformation helpers
├── src-tauri/                            # Native Core (Rust)
│   ├── src/
│   │   ├── commands/                     # Tauri command handlers (thin controllers)
│   │   ├── conversion/                   # LibreOffice process spawning and execution timeout
│   │   ├── document/                     # File verification, metadata extraction
│   │   ├── errors/                       # Centralized AppError enum and result types
│   │   ├── filesystem/                   # Atomic file writer, AppData layout, temp cleanup
│   │   ├── image/                        # Fast pixel thresholding and background removal
│   │   └── main.rs                       # Application bootstrap, Tauri builder
│   ├── Cargo.toml                        # Rust dependencies and configuration
│   └── tauri.conf.json                   # Tauri v2 application configuration
├── tests/                                # Synthetic test fixtures and end-to-end test suites
├── package.json                          # Node dependencies and build scripts
├── tsconfig.json                         # Strict TypeScript configuration
└── tailwind.config.js                    # Tailwind styling configuration
```

---

## 5. Architectural Invariants & Guarantees

### 5.1 Invariant 1: Normalized Coordinate System (`0.0` – `1.0`)
All visual object coordinates (`x`, `y`, `width`, `height`) are strictly stored in normalized unit space relative to the unscaled canonical dimensions of their parent PDF page:
$$x_{\text{norm}} = \frac{x_{\text{screen}}}{W_{\text{page}}}, \quad y_{\text{norm}} = \frac{y_{\text{screen}}}{H_{\text{page}}}$$
$$w_{\text{norm}} = \frac{w_{\text{screen}}}{W_{\text{page}}}, \quad h_{\text{norm}} = \frac{h_{\text{screen}}}{H_{\text{page}}}$$

- **Zoom Invariance:** Zoom levels (25% to 400%) re-scale the canvas on the fly without modifying stored normalized values.
- **DPI Invariance:** Display density scaling (100%, 125%, 150%, 200%) does not alter placement precision.
- **Export Mapping:** When exporting, normalized coordinates map deterministically to Native PDF Points (72 DPI, bottom-left origin):
  $$\text{pdfX} = x_{\text{norm}} \times W_{\text{pt}}, \quad \text{pdfY} = (1.0 - y_{\text{norm}} - h_{\text{norm}}) \times H_{\text{pt}}$$

### 5.2 Invariant 2: Original File Immutability & Atomic Write Protocol
The user's original document is sacred and read-only. Export operations enforce:
0. **Source Path Protection:** Rejects any export target whose canonical path matches the source file (`canonicalize(target) != canonicalize(source)`), preventing accidental overwrites.
1. **In-Memory Rendering:** Assemble the signed document into memory (`Uint8Array` in frontend).
2. **Temporary File Generation:** Stream buffer to a unique temporary file (`*.tmp.[uuid]`).
3. **Integrity Validation:** Verify file size > 0 and validate PDF header (`%PDF-`).
4. **Atomic Rename:** Atomically rename `.tmp` to target `[DocumentName]_SIGNED.pdf`. On any failure, the temporary file is immediately purged, leaving the file system unaltered.

### 5.3 Invariant 3: Vector & Text Preservation (`BR-009`)
Export operations never rasterize existing PDF pages to bitmaps. All original text streams, searchable characters, fonts, and vector paths are preserved intact. Signatures and stamps are composited as graphical overlay XObjects.

### 5.4 Invariant 4: Privacy & Air-Gapped Operation
All image assets, scanned signatures, club seals, and documents remain strictly local. No network calls are permitted. Test suites use synthetic placeholder fixtures with visible watermark labels.
