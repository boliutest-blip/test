pub mod commands;
pub mod error;
pub mod menu;
pub mod models;
pub mod services;

use commands::{document, workspace};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            menu::configure_menu(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            workspace::get_app_state,
            workspace::pick_directory,
            workspace::open_workspace,
            workspace::persist_workspace,
            document::read_document,
            document::save_document,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
