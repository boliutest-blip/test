use std::path::PathBuf;

use crate::{
    models::document::{
        ReadDocumentRequest, ReadDocumentResponse, SaveDocumentRequest, SaveDocumentResponse,
    },
    services::document_service,
};

#[tauri::command]
pub fn read_document(request: ReadDocumentRequest) -> Result<ReadDocumentResponse, String> {
    let workspace_directory = PathBuf::from(&request.workspace_directory);
    let document_path = PathBuf::from(&request.path);
    let content = document_service::read_document(&workspace_directory, &document_path)
        .map_err(|error| error.to_string())?;

    Ok(ReadDocumentResponse {
        path: request.path,
        content,
    })
}

#[tauri::command]
pub fn save_document(request: SaveDocumentRequest) -> Result<SaveDocumentResponse, String> {
    let workspace_directory = PathBuf::from(&request.workspace_directory);
    let document_path = PathBuf::from(&request.path);

    document_service::save_document(&workspace_directory, &document_path, &request.content)
        .map_err(|error| error.to_string())?;

    Ok(SaveDocumentResponse { path: request.path })
}
