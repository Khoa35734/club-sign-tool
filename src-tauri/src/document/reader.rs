//! Document file reader domain service.
//! Safely reads document file bytes into memory for frontend inspection.
//! Reference: docs/SRS.md FR-PDF-001, FR-FILE-001 & .agents/rules/tauri-rust.md

use crate::document::dialog::validate_document_extension;
use crate::errors::AppError;
use std::fs::File;
use std::io::Read;
use std::path::Path;

/// Maximum allowed document size: 50 MB to prevent memory exhaustion
const MAX_DOCUMENT_BYTES: u64 = 50 * 1024 * 1024;

/// Safely reads the binary bytes of a local document file.
/// Validates existence, regular file status, extension, and enforces size limit.
pub fn read_document_bytes(file_path: &str) -> Result<Vec<u8>, AppError> {
    let p = Path::new(file_path);

    if !p.exists() {
        return Err(AppError::InvalidFile(format!(
            "Tệp tin không tồn tại hoặc đã bị di chuyển: {file_path}"
        )));
    }

    if !p.is_file() {
        return Err(AppError::InvalidFile(
            "Đường dẫn được chọn không phải là một tệp tin hợp lệ.".into(),
        ));
    }

    validate_document_extension(file_path)?;

    let metadata = std::fs::metadata(p).map_err(|e| {
        AppError::IoError(format!("Không thể đọc thông tin tệp tin: {e}"))
    })?;

    let file_size = metadata.len();
    if file_size == 0 {
        return Err(AppError::InvalidFile(
            "Tệp tin rỗng (0 bytes). Vui lòng chọn một tài liệu hợp lệ.".into(),
        ));
    }

    if file_size > MAX_DOCUMENT_BYTES {
        return Err(AppError::InvalidFile(
            "Kích thước tệp tin vượt quá giới hạn tối đa cho phép (50 MB).".into(),
        ));
    }

    let mut file = File::open(p).map_err(|e| {
        AppError::IoError(format!("Không thể mở tệp tin để đọc: {e}"))
    })?;

    let mut buffer = Vec::with_capacity(file_size as usize);
    file.read_to_end(&mut buffer).map_err(|e| {
        AppError::IoError(format!("Không thể đọc nội dung tệp tin: {e}"))
    })?;

    Ok(buffer)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_read_nonexistent_file() {
        let result = read_document_bytes("C:/nonexistent_file_xyz999.pdf");
        assert!(result.is_err());
        match result.unwrap_err() {
            AppError::InvalidFile(msg) => {
                assert!(msg.contains("không tồn tại hoặc đã bị di chuyển"));
            }
            other => panic!("Unexpected error type: {other:?}"),
        }
    }

    #[test]
    fn test_read_zero_byte_file() {
        let temp_dir = std::env::temp_dir();
        let empty_pdf = temp_dir.join("test_reader_empty.pdf");
        {
            let _f = File::create(&empty_pdf).expect("create empty test file");
        }

        let result = read_document_bytes(empty_pdf.to_str().unwrap());
        let _ = std::fs::remove_file(&empty_pdf);

        assert!(result.is_err());
        match result.unwrap_err() {
            AppError::InvalidFile(msg) => {
                assert!(msg.contains("0 bytes"));
            }
            other => panic!("Unexpected error type: {other:?}"),
        }
    }

    #[test]
    fn test_read_valid_file() {
        let temp_dir = std::env::temp_dir();
        let valid_pdf = temp_dir.join("test_reader_valid.pdf");
        let content = b"%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF";
        {
            let mut f = File::create(&valid_pdf).expect("create test file");
            f.write_all(content).expect("write test content");
        }

        let result = read_document_bytes(valid_pdf.to_str().unwrap());
        let _ = std::fs::remove_file(&valid_pdf);

        assert!(result.is_ok());
        let bytes = result.unwrap();
        assert_eq!(bytes, content);
    }

    #[test]
    fn test_read_unsupported_extension() {
        let temp_dir = std::env::temp_dir();
        let txt_file = temp_dir.join("test_reader_unsupported.txt");
        {
            let mut f = File::create(&txt_file).expect("create test file");
            f.write_all(b"plain text").expect("write test content");
        }

        let result = read_document_bytes(txt_file.to_str().unwrap());
        let _ = std::fs::remove_file(&txt_file);

        assert!(result.is_err());
        match result.unwrap_err() {
            AppError::InvalidPath(msg) => {
                assert!(msg.contains("Only .pdf, .docx, and .doc are permitted"));
            }
            other => panic!("Unexpected error type: {other:?}"),
        }
    }
}
