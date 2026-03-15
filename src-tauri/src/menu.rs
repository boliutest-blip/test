use tauri::{menu::{MenuBuilder, SubmenuBuilder}, App, Emitter, Manager, Runtime};

pub const MENU_EVENT_OPEN_DIRECTORY: &str = "menu://open-directory";
pub const MENU_EVENT_SAVE: &str = "menu://save";

const MENU_ITEM_OPEN_DIRECTORY: &str = "file-open-directory";
const MENU_ITEM_SAVE: &str = "file-save";

pub fn configure_menu<R: Runtime>(app: &App<R>) -> tauri::Result<()> {
    let file_submenu = SubmenuBuilder::new(app, "File")
        .text(MENU_ITEM_OPEN_DIRECTORY, "Open Directory…")
        .separator()
        .text(MENU_ITEM_SAVE, "Save")
        .build()?;

    let menu = MenuBuilder::new(app).items(&[&file_submenu]).build()?;
    app.set_menu(menu)?;
    app.on_menu_event(|app_handle, event| {
        let event_name = match event.id().0.as_str() {
            MENU_ITEM_OPEN_DIRECTORY => Some(MENU_EVENT_OPEN_DIRECTORY),
            MENU_ITEM_SAVE => Some(MENU_EVENT_SAVE),
            _ => None,
        };

        if let Some(event_name) = event_name {
            let _ = app_handle.emit(event_name, ());
        }
    });

    Ok(())
}
