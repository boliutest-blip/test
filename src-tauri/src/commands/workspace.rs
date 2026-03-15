use std::path::PathBuf;

use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

use crate::{
    models::{
        app_state::{AppStateResponse, PersistWorkspaceRequest},
        workspace::{OpenWorkspaceRequest, OpenWorkspaceResponse, PickDirectoryResponse},
    },
    services::{settings_service, workspace_service},
};

#[tauri::command]
pub fn get_app_state(app: AppHandle) -> Result<AppStateResponse, String> {
    settings_service::load_app_state(&app).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn pick_directory(app: AppHandle) -> Result<PickDirectoryResponse, String> {
    let selection = app.dialog().file().blocking_pick_folder();
    let directory = selection
        .and_then(|file_path| file_path.into_path().ok())
        .map(|path| path.to_string_lossy().into_owned());

    Ok(PickDirectoryResponse { directory })
}

#[tauri::command]
pub fn open_workspace(request: OpenWorkspaceRequest) -> Result<OpenWorkspaceResponse, String> {
    let directory_path = PathBuf::from(&request.directory);
    let files = workspace_service::list_workspace_files(&directory_path).map_err(|error| error.to_string())?;

    Ok(OpenWorkspaceResponse {
        directory: request.directory,
        files,
    })
}

#[tauri::command]
pub fn persist_workspace(
    app: AppHandle,
    request: PersistWorkspaceRequest,
) -> Result<AppStateResponse, String> {
    settings_service::persist_app_state(
        &app,
        request.last_opened_directory.as_deref(),
        request.last_opened_file.as_deref(),
    )
    .map_err(|error| error.to_string())?;

    settings_service::load_app_state(&app).map_err(|error| error.to_string())
}

