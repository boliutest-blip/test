use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppStateResponse {
    pub last_opened_directory: Option<String>,
    pub last_opened_file: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersistWorkspaceRequest {
    pub last_opened_directory: Option<String>,
    pub last_opened_file: Option<String>,
}
