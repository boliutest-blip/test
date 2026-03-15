use std::{
    io::Write,
    path::{Path, PathBuf},
};

use crate::{
    error::AppError,
    services::path_service::{canonicalize_directory, ensure_document_in_workspace},
};

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

pub fn create_document(
    workspace_directory: &Path,
    file_name: &str,
    content: &str,
) -> Result<PathBuf, AppError> {
    let workspace_directory = canonicalize_directory(workspace_directory)?;

    // Ensure we always create an `.excalidraw` file
    let mut base_name = if file_name.is_empty() {
        "Untitled.excalidraw".to_string()
    } else if file_name.ends_with(".excalidraw") {
        file_name.to_string()
    } else {
        format!("{file_name}.excalidraw")
    };

    let mut candidate_path = workspace_directory.join(&base_name);
    let mut counter = 2;
    while candidate_path.exists() {
        base_name = if file_name.is_empty() {
            format!("Untitled ({counter}).excalidraw")
        } else {
            let stem = candidate_path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Untitled");
            format!("{stem} ({counter}).excalidraw")
        };
        candidate_path = workspace_directory.join(&base_name);
        counter += 1;
    }

    let parent_directory = candidate_path
        .parent()
        .ok_or(AppError::DocumentCannotBeSaved)?;

    let mut temporary_file = tempfile::NamedTempFile::new_in(parent_directory)
        .map_err(|_| AppError::DocumentCannotBeSaved)?;

    temporary_file
        .write_all(content.as_bytes())
        .map_err(|_| AppError::DocumentCannotBeSaved)?;

    temporary_file
        .persist(&candidate_path)
        .map_err(|_| AppError::DocumentCannotBeSaved)?;

    // Reuse the workspace boundary check to be safe
    let canonical_path =
        ensure_document_in_workspace(&workspace_directory, &candidate_path)?;

    Ok(canonical_path)
}
