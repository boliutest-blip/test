use std::path::{Path, PathBuf};

use crate::error::AppError;

pub fn canonicalize_directory(path: &Path) -> Result<PathBuf, AppError> {
    let canonical_path = std::fs::canonicalize(path).map_err(|_| AppError::DirectoryCannotBeRead)?;

    if canonical_path.is_dir() {
        Ok(canonical_path)
    } else {
        Err(AppError::DirectoryCannotBeRead)
    }
}

pub fn canonicalize_document(path: &Path) -> Result<PathBuf, AppError> {
    let canonical_path = std::fs::canonicalize(path).map_err(|_| AppError::DocumentCannotBeRead)?;

    if canonical_path.is_file() {
        Ok(canonical_path)
    } else {
        Err(AppError::DocumentCannotBeRead)
    }
}

pub fn ensure_document_in_workspace(workspace_directory: &Path, document_path: &Path) -> Result<PathBuf, AppError> {
    let canonical_workspace = canonicalize_directory(workspace_directory)?;
    let canonical_document = canonicalize_document(document_path)?;

    if canonical_document.starts_with(&canonical_workspace) {
        Ok(canonical_document)
    } else {
        Err(AppError::DocumentOutsideWorkspace)
    }
}
