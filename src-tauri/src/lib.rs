pub mod commands;
pub mod conversion;
pub mod document;
pub mod errors;
pub mod filesystem;
pub mod image;
pub mod pdf;

#[cfg(not(test))]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::document::open_file_dialog,
            commands::document::validate_document_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
