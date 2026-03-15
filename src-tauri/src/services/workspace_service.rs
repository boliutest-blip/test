use std::path::Path;

use crate::{
    error::AppError,
    models::workspace::WorkspaceFileSummary,
    services::path_service::canonicalize_directory,
};

pub fn list_workspace_files(workspace_directory: &Path) -> Result<Vec<WorkspaceFileSummary>, AppError> {
    let workspace_directory = canonicalize_directory(workspace_directory)?;

    let mut files = std::fs::read_dir(&workspace_directory)
        .map_err(|_| AppError::DirectoryCannotBeRead)?
        .filter_map(Result::ok)
        .filter_map(|entry| {
            let file_type = entry.file_type().ok()?;
            if !file_type.is_file() {
                return None;
            }

            let path = entry.path();
            let extension = path.extension()?.to_str()?;
            if extension != "excalidraw" {
                return None;
            }

            let name = path.file_name()?.to_str()?.to_owned();
            let path = path.to_string_lossy().into_owned();

            Some(WorkspaceFileSummary { name, path })
        })
        .collect::<Vec<_>>();

    files.sort_by(|left, right| left.name.cmp(&right.name));

    Ok(files)
}
