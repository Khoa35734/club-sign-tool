---
trigger: always_on
description: "Core architectural boundaries, offline-first constraints, feature-based directory structure, and anti-scope-creep invariants."
---

# Architecture & Scope Boundaries

## 1. Target Environment & Tech Stack
- **Target OS:** Windows 10 / Windows 11 (64-bit).
- **Desktop Runtime:** Tauri (Rust Native Core + Microsoft Edge WebView2).
- **Frontend Framework:** React 19, TypeScript, Tailwind CSS.
- **Canvas & Rendering Engine:** PDF.js (document rendering) + Konva.js / React-Konva (interactive overlay).
- **PDF Manipulation & Export:** `pdf-lib` (frontend) or native Rust PDF engine (`lopdf` / `pdfium`).
- **Word Conversion Engine:** Local LibreOffice Headless CLI (`soffice.exe --headless --convert-to pdf`).
- **Configuration & State Persistence:** Local JSON files in `%APPDATA%/ClubSignTool/`.

---

## 2. System Architecture Layers & Dependency Direction
Code dependencies must flow strictly inward and downward:

```text
[Presentation / UI Components]
           │
           ▼
[Feature Modules: src/features/*]
           │
           ▼
[Application State (Zustand) & Client Services]
           │
           ▼
[Tauri IPC Bridge: invoke('command_name', ...)]
           │
           ▼
[Tauri Command Handlers: src-tauri/src/commands/*]
           │
           ▼
[Rust Native Domain Services: PDF, Word Conversion, Image Processing, Filesystem]
```

**Rules of Dependency Direction:**
1. UI components must never directly execute native shell commands; they must call typed frontend service wrappers that trigger Tauri IPC.
2. Tauri command handlers must remain **thin controllers**: parse inputs, invoke native domain services, handle errors, and return typed results.
3. Native domain services must be modular, testable independently, and have zero dependency on the UI layer.

---

## 3. Directory Layout Standards (Feature-Based Structure)
Organize frontend code primarily by **feature**, not by technical type. Do not pre-create empty directories; introduce them only when implementing the corresponding feature:

```text
src/
├── app/                  # Application root, routing/layout, providers
├── components/           # Shared, domain-agnostic UI components (buttons, modals, tooltips)
├── features/             # Feature-sliced modules
│   ├── document/         # File opening, page navigation, thumbnail strip
│   ├── editor/           # Canvas overlay, selection, transform controls, zoom/pan
│   ├── signature/        # Signature library, signature placement
│   ├── stamp/            # Stamp library, stamp placement, opacity blending
│   ├── image-editor/     # Background removal, cropping, rotation, brightness/contrast
│   ├── word-conversion/  # LibreOffice conversion triggers, progress indicators
│   ├── export/           # Export dialog, destination selector, atomic write trigger
│   └── settings/         # App preferences, LibreOffice path, default opacity
├── hooks/                # Cross-cutting custom hooks (window resize, shortcuts)
├── services/             # Tauri IPC client wrappers, file system helpers
├── stores/               # Global Zustand stores (editorStore, documentStore, settingsStore)
├── types/                # Core domain types (document, editor-object, settings)
└── utils/                # Pure mathematical, formatting, and coordinate conversion utilities
```

Rust backend organization (`src-tauri/src/`):
```text
src-tauri/src/
├── commands/             # Tauri IPC entry points (document, conversion, image, export)
├── conversion/           # LibreOffice headless execution and process management
├── document/             # Document loading, metadata extraction, page counting
├── errors/               # Centralized typed error definitions (AppError, Result<T, AppError>)
├── filesystem/           # AppData management, atomic file writer, temp cleanup
├── image/                # Pixel manipulation, white background removal, format encoding
├── pdf/                  # Native PDF parsing, stamping, vector preservation
└── main.rs               # Application bootstrap and command registration
```

---

## 4. Zero-Infrastructure Invariant
This application is strictly **offline-first and zero-infrastructure**:
- **No Database:** Never introduce SQLite, PostgreSQL, MySQL, Redis, LevelDB, or IndexedDB complex schema managers.
- **No Web Server:** Never spawn local HTTP/REST/WebSocket servers in Rust or Node.js.
- **No Cloud Integration:** No AWS SDK, MinIO, Google Drive, Firebase, or external API clients.
- **AppData Storage:** Store application configuration, recent file lists, and saved asset metadata exclusively in `%APPDATA%/ClubSignTool/config.json` and `%APPDATA%/ClubSignTool/assets.json`.

---

## 5. Dependency Addition Protocol
Before adding any npm package or Cargo crate, answer these six questions:
1. **Can existing dependencies solve this?** (e.g., using existing `canvas` or `image` crate instead of adding a new library).
2. **Can a trivial function solve this?** (e.g., writing a 20-line utility instead of importing `lodash`).
3. **Is the library maintained?** Active within the last 12 months, zero high-severity CVEs.
4. **Is the license compatible?** Proprietary closed-source friendly (MIT, Apache 2.0, BSD, ISC). **Strictly reject AGPL and GPL** without explicit developer authorization.
5. **Is it 100% offline?** Does not attempt to phone home, fetch fonts, or download binaries on install.
6. **What is the binary footprint?** Avoid heavy native bindings that bloat the Tauri distribution.
