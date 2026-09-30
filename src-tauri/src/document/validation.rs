//! Document file integrity and format validation.
//! Reference: docs/SRS.md FR-FILE-ERR, EC-001, EC-002, UC-001

use crate::document::dialog::validate_document_extension;
use crate::errors::AppError;
use std::fs::File;
use std::io::Read;
use std::path::Path;

/// Result structure returned to frontend on successful validation.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DocumentValidationResult {
    pub path: String,
    pub file_name: String,
    pub file_type: String,
    pub file_size_bytes: u64,
}

/// Validates that a file:
/// 1. Exists on disk and is a regular file (not directory).
/// 2. Has a supported document extension (.pdf, .docx, .doc).
/// 3. Is readable and has size > 0 bytes (rejects 0-byte empty files).
/// 4. Matches expected file header / magic bytes for its extension:
///    - .pdf must contain "%PDF-" within the first 1024 bytes.
///    - .docx must begin with ZIP magic bytes PK\x03\x04 or PK\x05\x06 / PK\x07\x08.
///    - .doc must begin with OLE compound document signature (D0 CF 11 E0) or Word binary signature.
pub fn validate_document(file_path: &str) -> Result<DocumentValidationResult, AppError> {
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

    // 1. Extension check
    validate_document_extension(file_path)?;

    // 2. Metadata & 0-byte check
    let metadata = std::fs::metadata(p).map_err(|e| {
        AppError::IoError(format!("Không thể đọc thông tin tệp tin: {e}"))
    })?;

    let file_size_bytes = metadata.len();
    if file_size_bytes == 0 {
        return Err(AppError::InvalidFile(
            "Tệp tin rỗng (0 bytes). Vui lòng chọn một tài liệu hợp lệ.".into(),
        ));
    }

    // 3. Inspect header / magic bytes
    let ext = p
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();

    let mut file = File::open(p).map_err(|e| {
        AppError::IoError(format!("Không thể mở tệp tin để kiểm tra: {e}"))
    })?;

    let mut buffer = [0u8; 1024];
    let bytes_read = file.read(&mut buffer).map_err(|e| {
        AppError::IoError(format!("Không thể đọc dữ liệu tệp tin: {e}"))
    })?;

    if bytes_read == 0 {
        return Err(AppError::InvalidFile(
            "Tệp tin rỗng (0 bytes). Vui lòng chọn một tài liệu hợp lệ.".into(),
        ));
    }

    let slice = &buffer[..bytes_read];

    match ext.as_str() {
        "pdf" => {
            // ISO 32000-1: %PDF- appears in the first 1024 bytes
            if bytes_read < 5 || !slice.windows(5).any(|w| w == b"%PDF-") {
                return Err(AppError::InvalidFile(
                    "Tệp tin không đúng định dạng chuẩn của tài liệu PDF hoặc đã bị hỏng. Vui lòng kiểm tra lại nguồn file.".into(),
                ));
            }
        }
        "docx" => {
            // DOCX is an OOXML ZIP container starting with PK\x03\x04 or PK\x05\x06 or PK\x07\x08
            let is_zip = bytes_read >= 4
                && slice[0] == 0x50
                && slice[1] == 0x4B
                && (slice[2] == 0x03 || slice[2] == 0x05 || slice[2] == 0x07);
            if !is_zip {
                return Err(AppError::InvalidFile(
                    "Tệp tin không đúng định dạng tài liệu Word (.docx) hoặc đã bị hỏng. Vui lòng kiểm tra lại nguồn file.".into(),
                ));
            }
        }
        "doc" => {
            // Classic Word DOC: OLE Compound Document (D0 CF 11 E0 A1 B1 1A E1) or Word binary
            let is_ole = bytes_read >= 4
                && slice[0] == 0xD0
                && slice[1] == 0xCF
                && slice[2] == 0x11
                && slice[3] == 0xE0;
            let is_word_bin = bytes_read >= 2
                && ((slice[0] == 0xEC && slice[1] == 0xA5)
                    || (slice[0] == 0xDB && slice[1] == 0xA5));
            if !is_ole && !is_word_bin {
                return Err(AppError::InvalidFile(
                    "Tệp tin không đúng định dạng tài liệu Word (.doc) hoặc đã bị hỏng. Vui lòng kiểm tra lại nguồn file.".into(),
                ));
            }
        }
        _ => {
            return Err(AppError::InvalidFile(format!(
                "Định dạng tệp không được hỗ trợ: .{ext}. Chỉ chấp nhận .pdf, .docx, .doc."
            )));
        }
    }

    let file_name = p
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(file_path)
        .to_string();

    Ok(DocumentValidationResult {
        path: file_path.to_string(),
        file_name,
        file_type: ext,
        file_size_bytes,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_validate_nonexistent_file() {
        let result = validate_document("C:/nonexistent_file_abc123.pdf");
        assert!(result.is_err());
        match result.unwrap_err() {
            AppError::InvalidFile(msg) => {
                assert!(msg.contains("không tồn tại hoặc đã bị di chuyển"));
            }
            other => panic!("Unexpected error type: {other:?}"),
        }
    }

    #[test]
    fn test_validate_zero_byte_file() {
        let temp_dir = std::env::temp_dir();
        let empty_pdf = temp_dir.join("test_empty_0byte.pdf");
        {
            let _f = File::create(&empty_pdf).expect("create empty test file");
        }

        let result = validate_document(empty_pdf.to_str().unwrap());
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
    fn test_validate_corrupted_pdf() {
        let temp_dir = std::env::temp_dir();
        let corrupted_pdf = temp_dir.join("test_corrupted.pdf");
        {
            let mut f = File::create(&corrupted_pdf).expect("create corrupted test file");
            f.write_all(b"Hello world, this is a corrupted plain text pretending to be PDF")
                .expect("write content");
        }

        let result = validate_document(corrupted_pdf.to_str().unwrap());
        let _ = std::fs::remove_file(&corrupted_pdf);

        assert!(result.is_err());
        match result.unwrap_err() {
            AppError::InvalidFile(msg) => {
                assert!(msg.contains("không đúng định dạng chuẩn của tài liệu PDF"));
            }
            other => panic!("Unexpected error type: {other:?}"),
        }
    }

    #[test]
    fn test_validate_valid_pdf() {
        let temp_dir = std::env::temp_dir();
        let valid_pdf = temp_dir.join("test_valid.pdf");
        {
            let mut f = File::create(&valid_pdf).expect("create valid test file");
            f.write_all(b"%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF")
                .expect("write content");
        }

        let result = validate_document(valid_pdf.to_str().unwrap());
        let _ = std::fs::remove_file(&valid_pdf);

        assert!(result.is_ok());
        let res = result.unwrap();
        assert_eq!(res.file_type, "pdf");
        assert!(res.file_size_bytes > 0);
    }

    #[test]
    fn test_validate_corrupted_docx() {
        let temp_dir = std::env::temp_dir();
        let corrupted_docx = temp_dir.join("test_corrupted.docx");
        {
            let mut f = File::create(&corrupted_docx).expect("create corrupted docx file");
            f.write_all(b"not a valid zip container file")
                .expect("write content");
        }

        let result = validate_document(corrupted_docx.to_str().unwrap());
        let _ = std::fs::remove_file(&corrupted_docx);

        assert!(result.is_err());
        match result.unwrap_err() {
            AppError::InvalidFile(msg) => {
                assert!(msg.contains("không đúng định dạng tài liệu Word (.docx)"));
            }
            other => panic!("Unexpected error type: {other:?}"),
        }
    }

    #[test]
    fn test_validate_valid_docx() {
        let temp_dir = std::env::temp_dir();
        let valid_docx = temp_dir.join("test_valid.docx");
        {
            let mut f = File::create(&valid_docx).expect("create valid docx file");
            // Standard ZIP local file header
            f.write_all(&[0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00])
                .expect("write content");
        }

        let result = validate_document(valid_docx.to_str().unwrap());
        let _ = std::fs::remove_file(&valid_docx);

        assert!(result.is_ok());
        let res = result.unwrap();
        assert_eq!(res.file_type, "docx");
        assert_eq!(res.file_size_bytes, 8);
    }
}
