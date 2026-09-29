---
trigger: glob
globs: "*.rs, src-tauri/**/*.rs, Cargo.toml"
description: "Tauri IPC boundaries, Rust error handling, memory safety, path validation, and background async execution."
---

# Tauri & Rust Engineering Standards

## 1. Result-Based Error Handling & Zero-Panic Policy
- **Custom Typed Errors:** Define domain-specific errors using an `AppError` enum in `src-tauri/src/errors/mod.rs`. Implement `std::fmt::Display`, `std::error::Error`, and `serde::Serialize`:
  ```rust
  #[derive(Debug, serde::Serialize)]
  #[serde(tag = "type", content = "message")]
  pub enum AppError {
      IoError(String),
      ConversionError(String),
      PdfError(String),
      InvalidPath(String),
      LibreOfficeNotFound,
      Cancelled,
  }
  ```
- **Tauri Command Signature:** Every command that performs I/O, process execution, or data manipulation must return `Result<T, AppError>`:
  ```rust
  #[tauri::command]
  pub async fn convert_word_to_pdf(input_path: String) -> Result<String, AppError> { ... }
  ```
- **Zero Panic Rule:** Strictly prohibit `unwrap()`, `expect()`, and `panic!()` on code paths that parse user files, inspect paths, or execute subprocesses. Always propagate errors using the `?` operator or handle them explicitly with `match` / `if let`.

---

## 2. Thin Tauri Command Boundary
- **Separation of Concerns:** Handlers in `src-tauri/src/commands/` are controllers. They must:
  1. Validate incoming argument formats and parameters.
  2. Call the appropriate domain engine in `conversion/`, `pdf/`, `image/`, or `filesystem/`.
  3. Map internal Rust domain errors to `AppError`.
- **No Inlined Business Logic:** Never embed subprocess execution loops, raw pixel algorithms, or PDF binary operations directly inside a `#[tauri::command]` function.

---

## 3. Filesystem Safety & Path Handling (Windows Target)
- **Path Sanitization:** Always validate paths before access. Verify canonical paths using `std::fs::canonicalize` or path normalization to prevent directory traversal (`..`).
- **Original File Protection:** Native commands must never open input files with write/truncate modes (`std::fs::OpenOptions::new().write(true)` on source files is forbidden).
- **Atomic File Writing:** Always write output files to a temporary file (`.tmp_*.pdf`) first, verify file integrity, and perform an atomic rename/move to the target path.
- **AppData Directory:** Application configuration, cached thumbnails, and saved visual signatures must be stored under the official OS AppData path resolved via `tauri::PathResolver` (`%APPDATA%/ClubSignTool/`).

---

## 4. Asynchronous & Non-Blocking Execution
- **Never Block the Main/UI Thread:** Operations that take more than 10ms (LibreOffice conversion, multi-page PDF rasterization, image background removal, PDF export) must execute in the background.
- **Worker Threads:** Use `tauri::async_runtime::spawn_blocking` for CPU-intensive tasks (image filtering, PDF merging) or heavy synchronous subprocess calls.
- **Progress Streaming:** For multi-page or long conversions, emit progress events to the frontend via `app_handle.emit("conversion-progress", payload)` to keep the UI responsive.

---

## 5. Subprocess Execution (LibreOffice Headless)
- **Process Isolation:** When invoking `soffice.exe`:
  - Enforce `--headless --convert-to pdf --outdir <temp_dir> <input_file>`.
  - Use `std::process::Command` with `creation_flags(0x08000000)` (`CREATE_NO_WINDOW`) on Windows to suppress console popups.
  - Implement a strict timeout (e.g., 30–60 seconds). If the process exceeds the timeout, kill the child process and return `AppError::ConversionError("Conversion timed out")`.
  - Validate that the output PDF actually exists and is non-empty before returning success.

---

## 6. Unsafe Code Restrictions
- Avoid `unsafe` blocks. Standard Rust and safe abstractions must be used.
- If `unsafe` is ever required for specific foreign C-FFI or low-level Windows APIs:
  1. It must be isolated in a dedicated module.
  2. It must have a preceding `// SAFETY:` comment documenting the exact invariants.
  3. It must have dedicated unit tests covering edge cases.
