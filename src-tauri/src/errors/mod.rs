//! Centralized typed errors for Club Sign Tool native operations.

use std::fmt;

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

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::IoError(msg) => write!(f, "I/O Error: {msg}"),
            Self::ConversionError(msg) => write!(f, "Conversion Error: {msg}"),
            Self::PdfError(msg) => write!(f, "PDF Error: {msg}"),
            Self::InvalidPath(msg) => write!(f, "Invalid Path: {msg}"),
            Self::LibreOfficeNotFound => write!(f, "LibreOffice executable was not found on this system"),
            Self::Cancelled => write!(f, "Operation was cancelled by user"),
        }
    }
}

impl std::error::Error for AppError {}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        Self::IoError(err.to_string())
    }
}
