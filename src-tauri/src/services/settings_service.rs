use serde_json::{json, Value};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

use crate::{error::AppError, models::app_state::AppStateResponse};

const STORE_PATH: &str = "app-state.json";
const LAST_OPENED_DIRECTORY_KEY: &str = "lastOpenedDirectory";
const LAST_OPENED_FILE_KEY: &str = "lastOpenedFile";

pub fn load_app_state(app: &AppHandle) -> Result<AppStateResponse, AppError> {
    let store = app
        .store(STORE_PATH)
        .map_err(|_| AppError::SettingsCannotBeRead)?;

    let last_opened_directory = read_optional_string(&store.get(LAST_OPENED_DIRECTORY_KEY));
    let last_opened_file = read_optional_string(&store.get(LAST_OPENED_FILE_KEY));

    Ok(AppStateResponse {
        last_opened_directory,
        last_opened_file,
    })
}

pub fn persist_app_state(
    app: &AppHandle,
    last_opened_directory: Option<&str>,
    last_opened_file: Option<&str>,
) -> Result<(), AppError> {
    let store = app
        .store(STORE_PATH)
        .map_err(|_| AppError::SettingsCannotBeSaved)?;

    store.set(
        LAST_OPENED_DIRECTORY_KEY,
        optional_string_value(last_opened_directory),
    );
    store.set(LAST_OPENED_FILE_KEY, optional_string_value(last_opened_file));
    store.save().map_err(|_| AppError::SettingsCannotBeSaved)
}

fn optional_string_value(value: Option<&str>) -> Value {
    value.map_or(Value::Null, |text| json!(text))
}

fn read_optional_string(value: &Option<Value>) -> Option<String> {
    value.as_ref().and_then(|entry| entry.as_str().map(ToOwned::to_owned))
}
