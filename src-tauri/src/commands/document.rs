//! Document command handlers for Tauri IPC.

use crate::document::dialog::pick_document_file;
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
