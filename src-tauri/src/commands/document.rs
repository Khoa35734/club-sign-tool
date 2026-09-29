//! Document command handlers for Tauri IPC.

use crate::document::dialog::pick_document_file;
use crate::document::validation::{validate_document, DocumentValidationResult};
use crate::errors::AppError;

/// Tauri command to trigger the native file picker dialog restricted to .pdf, .docx, and .doc.
///
/// Returns `Ok(Some(path))` if selected, `Ok(None)` if cancelled, or `Err(AppError)` on failure.
#[tauri::command]
pub async fn open_file_dialog() -> Result<Option<String>, AppError> {
    tauri::async_runtime::spawn_blocking(pick_document_file)
        .await
        .map_err(|e| AppError::IoError(format!("Failed to spawn dialog thread: {e}")))?
}

/// Tauri command to validate document file existence, readability, size (> 0 bytes),
/// and header magic bytes.
#[tauri::command]
pub async fn validate_document_file(path: String) -> Result<DocumentValidationResult, AppError> {
    tauri::async_runtime::spawn_blocking(move || validate_document(&path))
        .await
        .map_err(|e| AppError::IoError(format!("Failed to spawn validation thread: {e}")))?
}
