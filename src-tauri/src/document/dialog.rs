//! Native file picker dialog for document selection restricted to .pdf, .docx, .doc.
//! Reference: docs/SRS.md FR-FILE-001, FR-FILE-002

use crate::errors::AppError;

/// Validates that a file path possesses a supported document extension (.pdf, .docx, .doc).
pub fn validate_document_extension(path: &str) -> Result<(), AppError> {
    let p = std::path::Path::new(path);
    match p.extension().and_then(|ext| ext.to_str()) {
        Some(ext) => {
            let lower = ext.to_ascii_lowercase();
            if lower == "pdf" || lower == "docx" || lower == "doc" {
                Ok(())
            } else {
                Err(AppError::InvalidPath(format!(
                    "Unsupported file extension: .{ext}. Only .pdf, .docx, and .doc are permitted."
                )))
            }
        }
        None => Err(AppError::InvalidPath(
            "File has no extension. Only .pdf, .docx, and .doc are permitted.".into(),
        )),
    }
}

#[cfg(target_os = "windows")]
#[repr(C)]
struct OpenFileNameW {
    l_struct_size: u32,
    hwnd_owner: *mut std::ffi::c_void,
    h_instance: *mut std::ffi::c_void,
    lpstr_filter: *const u16,
    lpstr_custom_filter: *mut u16,
    n_max_cust_filter: u32,
    n_filter_index: u32,
    lpstr_file: *mut u16,
    n_max_file: u32,
    lpstr_file_title: *mut u16,
    n_max_file_title: u32,
    lpstr_initial_dir: *const u16,
    lpstr_title: *const u16,
    flags: u32,
    n_file_offset: u16,
    n_file_extension: u16,
    lpstr_def_ext: *const u16,
    l_cust_data: usize,
    lpfn_hook: *mut std::ffi::c_void,
    lp_template_name: *const u16,
    pv_reserved: *mut std::ffi::c_void,
    dw_reserved: u32,
    flags_ex: u32,
}

#[cfg(target_os = "windows")]
#[link(name = "comdlg32")]
extern "system" {
    fn GetOpenFileNameW(lpofn: *mut OpenFileNameW) -> i32;
}

/// Opens the native Windows Open File Dialog restricted to .pdf, .docx, and .doc documents.
///
/// Returns `Ok(Some(path))` if a valid file was selected, `Ok(None)` if cancelled,
/// or `Err(AppError)` if validation or OS invocation failed.
#[cfg(target_os = "windows")]
pub fn pick_document_file() -> Result<Option<String>, AppError> {
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;

    let mut file_buf = vec![0u16; 4096];

    // Filter string: pairs of null-terminated strings, terminated by a final null
    let filter = "Tài liệu (*.pdf, *.docx, *.doc)\0*.pdf;*.docx;*.doc\0Tệp PDF (*.pdf)\0*.pdf\0Tệp Word (*.docx, *.doc)\0*.docx;*.doc\0\0"
        .encode_utf16()
        .collect::<Vec<u16>>();

    let title = "Chọn tài liệu để ký duyệt (PDF, DOCX, DOC)\0"
        .encode_utf16()
        .collect::<Vec<u16>>();

    const OFN_FILEMUSTEXIST: u32 = 0x00001000;
    const OFN_PATHMUSTEXIST: u32 = 0x00000800;
    const OFN_EXPLORER: u32 = 0x00080000;
    const OFN_NOCHANGEDIR: u32 = 0x00000008;

    // SAFETY: ofn is zero-initialized and stack/heap allocated buffers live for the duration of the call
    let mut ofn: OpenFileNameW = unsafe { std::mem::zeroed() };
    ofn.l_struct_size = std::mem::size_of::<OpenFileNameW>() as u32;
    ofn.lpstr_filter = filter.as_ptr();
    ofn.lpstr_file = file_buf.as_mut_ptr();
    ofn.n_max_file = file_buf.len() as u32;
    ofn.lpstr_title = title.as_ptr();
    ofn.flags = OFN_EXPLORER | OFN_FILEMUSTEXIST | OFN_PATHMUSTEXIST | OFN_NOCHANGEDIR;

    // SAFETY: GetOpenFileNameW reads filter/title and writes up to n_max_file characters into file_buf
    let result = unsafe { GetOpenFileNameW(&mut ofn) };

    if result == 0 {
        return Ok(None);
    }

    let len = file_buf.iter().position(|&c| c == 0).unwrap_or(file_buf.len());
    let path = OsString::from_wide(&file_buf[..len])
        .to_string_lossy()
        .to_string();

    validate_document_extension(&path)?;

    Ok(Some(path))
}

#[cfg(not(target_os = "windows"))]
pub fn pick_document_file() -> Result<Option<String>, AppError> {
    Ok(None)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_document_extension_valid() {
        assert!(validate_document_extension("document.pdf").is_ok());
        assert!(validate_document_extension("plan.docx").is_ok());
        assert!(validate_document_extension("letter.doc").is_ok());
        assert!(validate_document_extension("C:\\path\\to\\file.PDF").is_ok());
        assert!(validate_document_extension("C:\\path\\to\\file.DOCX").is_ok());
    }

    #[test]
    fn test_validate_document_extension_invalid() {
        assert!(validate_document_extension("image.png").is_err());
        assert!(validate_document_extension("script.js").is_err());
        assert!(validate_document_extension("archive.zip").is_err());
        assert!(validate_document_extension("no_extension").is_err());
    }
}
