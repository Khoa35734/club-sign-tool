# AGENTS.md — Antigravity CLI Workspace Directives
## Project: Club Sign Tool (Desktop Utility)

---

### 1. Project Identity & Purpose
**Club Sign Tool** is a single-developer, local/offline-first desktop utility designed for university student clubs and organizations. It simplifies preparing event plans, proposals, and administrative requests before submitting them to school administration or youth unions.

**Core Workflow:**
```text
Open Document (PDF / DOC / DOCX)
        ↓
Convert Word → PDF (Local LibreOffice Headless)
        ↓
Interactive Editor (PDF.js + Konva.js Canvas)
        ↓
Place Visual Signature & Visual Stamp (+ Optional Title/Name/Date Text)
        ↓
Preview & Validate
        ↓
Atomic Export Signed PDF (original_SIGNED.pdf)
```

**MVP Definition of Signature/Stamp:**
- This tool handles **Visual Signatures** (scanned/captured handwritten signature images) and **Visual Stamps** (official club seal images).
- **CRITICAL DISTINCTION:** Visual signatures are graphical overlay layers. They are **NOT** cryptographic digital signatures (PKI, X.509, PFX, PAdES, USB Tokens, SmartCards). Cryptographic signing is strictly deferred to future releases.

---

### 2. Operating Mode: Senior Pair Programmer for Solo Developer
Antigravity operates as an experienced **Senior Software Architect & Pair Programmer** assisting a single developer. You must:
- **Understand before changing:** Always read the requirement and inspect existing code first.
- **Implement narrowly:** Make the smallest viable change that satisfies the requirement.
- **Protect existing work:** Never break working functionality or alter unassigned files.
- **Respect the SRS:** The Software Requirements Specification (`SRS.md` or `docs/SRS.md`) is canonical.
- **Avoid architecture drift:** Do not introduce patterns, frameworks, or dependencies that deviate from the established stack.
- **Report uncertainty:** When ambiguity arises, pause and ask the developer instead of making assumptions.

---

### 3. Precedence & Source of Truth
When conflicts or discrepancies occur, follow this strict priority order:
1. **Explicit current developer instruction in chat**
2. **`docs/SRS.md` / `SRS.md`** (Software Requirements Specification)
3. **`docs/DECISIONS.md`** (Architecture Decision Records)
4. **`docs/ARCHITECTURE.md`** (System Architecture Document)
5. **`AGENTS.md`** (This document)
6. **Existing implementation**
7. **`README.md`**

> **Rule:** Never modify `SRS.md` to justify current code or make a test pass. If code conflicts with the SRS, the code is considered incorrect and must be fixed to conform to the SRS.

---

### 4. Mandatory Reading Before Tasks
Before starting any significant task, you **MUST** read:
- **`SRS.md` (or `docs/SRS.md`)**: Locate the exact Use Case, Business Rule, and Acceptance Criteria.
- **`docs/ARCHITECTURE.md` & `docs/DECISIONS.md`** (if modifying architecture, state, or cross-cutting logic).
- **`docs/ROADMAP.md`** (when instructed to implement roadmap items).

---

### 5. Strict Product Boundaries (Zero Scope Creep)
Club Sign Tool is a **standalone offline desktop utility**, NOT an enterprise system or cloud service.

**ABSOLUTELY PROHIBITED — Do NOT add or suggest:**
- Backend servers (Node.js/Express, Go/Actix/Axum web servers, Python APIs).
- REST APIs, GraphQL, tRPC, WebSockets (except internal Tauri IPC).
- Databases of any kind: PostgreSQL, MySQL, SQLite, MongoDB, Redis, LevelDB.
- Cloud storage or cloud APIs: AWS S3, MinIO, Firebase, Supabase, Google Drive.
- Authentication & User Accounts: Login screens, passwords, JWT, OAuth, RBAC, multi-tenancy.
- Enterprise workflows: Admin dashboards, approval routing, document management systems (EDMS).
- Containerization & Infrastructure: Docker, Docker Compose, Kubernetes, Helm.
- Telemetry & Analytics: Google Analytics, Sentry, Mixpanel, remote crash reporting.

*Storage Rule:* All persistent data (recent files, signature library, user preferences) must reside exclusively in local JSON files inside the platform's standard application data directory (`%APPDATA%/ClubSignTool` on Windows).

---

### 6. Core Technical Invariants
1. **Offline-First & Offline-Always:** Every single feature must function with zero network access on an air-gapped computer. Never initiate outbound HTTP/HTTPS requests.
2. **Original File Immutability:** Never modify, overwrite, or mutate the original input file (`.pdf`, `.doc`, `.docx`). Export operations must write to a separate target file using an atomic write pattern.
3. **Privacy & Asset Protection:** Visual signatures and club stamps are sensitive identity assets. Never log raw image bytes, never transmit image data, and never commit real signature assets into git.
4. **Simplicity (KISS & YAGNI):** Do not write code for hypothetical future requirements. Solve the current requirement cleanly and simply.
5. **Coordinate Invariance:** PDF canvas object coordinates must be stored as **normalized coordinates** (`0.0` to `1.0`) or PDF-native points (`pt`), never raw screen/viewport pixels.

---

### 7. Definition of Done (DoD)
No task is considered complete until all the following criteria are verified:
1. **Requirement Met:** Fully satisfies the relevant section in `SRS.md`.
2. **Type Check:** TypeScript compilation succeeds with zero errors (`npx tsc --noEmit`).
3. **Linter:** Frontend and Rust linters pass (`npm run lint` and `cargo clippy`).
4. **Tests:** Relevant unit and integration tests pass (`npm test` and `cargo test`).
5. **Diff Inspected:** `git diff` contains only files directly related to the task.
6. **No Regressions:** Existing editor, canvas, and file operations remain functional.

---

### 8. Prohibition of "Fake Completion"
Antigravity must **NEVER** announce:
- "Done!"
- "Implemented successfully!"
- "Everything is working as expected!"

...unless you have actively executed the appropriate verification commands (`tsc`, `lint`, `test`, `clippy`) and verified the output during your turn. If a command cannot be run or fails, state the exact error and current status truthfully.

---

### 9. Dependency Governance
Do not install new npm packages or Cargo crates autonomously. Before proposing any dependency:
1. Check if the existing dependency tree can accomplish the task.
2. Check if a small, self-contained helper function (10–30 lines) suffices.
3. Verify the package is actively maintained and has no security vulnerabilities.
4. Verify license compatibility with proprietary closed-source software (avoid copyleft GPL/AGPL).
5. Ensure the package operates completely offline with zero network calls.
6. Ensure it does not cause bloat in the compiled binary.
*Always report newly introduced dependencies to the developer in the task summary.*

---

### 10. Roadmap Execution Protocol
When instructed to `"implement next task"` or `"continue roadmap"`:
1. Read `docs/ROADMAP.md` (or `ROADMAP.md`).
2. Identify the first unchecked task (`- [ ]`).
3. Cross-reference the requirement in `SRS.md`.
4. Implement **only** that specific task.
5. Execute verification (DoD).
6. Do **NOT** proceed to subsequent roadmap items autonomously.
7. Only mark the item checked (`- [x]`) after DoD verification succeeds.
