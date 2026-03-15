use std::{io::Write, path::Path};

use crate::{error::AppError, services::path_service::ensure_document_in_workspace};

pub fn read_document(workspace_directory: &Path, document_path: &Path) -> Result<String, AppError> {
    let document_path = ensure_document_in_workspace(workspace_directory, document_path)?;

    std::fs::read_to_string(document_path).map_err(|_| AppError::DocumentCannotBeRead)
}

pub fn save_document(workspace_directory: &Path, document_path: &Path, content: &str) -> Result<(), AppError> {
    let document_path = ensure_document_in_workspace(workspace_directory, document_path)?;
    let parent_directory = document_path.parent().ok_or(AppError::DocumentCannotBeSaved)?;

    let mut temporary_file = tempfile::NamedTempFile::new_in(parent_directory)
        .map_err(|_| AppError::DocumentCannotBeSaved)?;

    temporary_file
        .write_all(content.as_bytes())
        .map_err(|_| AppError::DocumentCannotBeSaved)?;

    temporary_file
        .persist(document_path)
        .map_err(|_| AppError::DocumentCannotBeSaved)?;

    Ok(())
}
