use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Directory cannot be read")]
    DirectoryCannotBeRead,
    #[error("Document cannot be read")]
    DocumentCannotBeRead,
    #[error("Document cannot be saved")]
    DocumentCannotBeSaved,
    #[error("Document is outside the current workspace")]
    DocumentOutsideWorkspace,
    #[error("Settings cannot be read")]
    SettingsCannotBeRead,
    #[error("Settings cannot be saved")]
    SettingsCannotBeSaved,
}
