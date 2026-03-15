use std::path::Path;

use tempfile::tempdir;

use excaliapp_lib::services::workspace_service::list_workspace_files;

#[test]
fn lists_only_excalidraw_files_sorted_by_name() {
    let workspace = tempdir().expect("workspace tempdir should be created");

    std::fs::write(workspace.path().join("b.excalidraw"), "{}").expect("should write b file");
    std::fs::write(workspace.path().join("a.excalidraw"), "{}").expect("should write a file");
    std::fs::write(workspace.path().join("notes.txt"), "ignore").expect("should write txt file");
    std::fs::create_dir(workspace.path().join("nested.excalidraw")).expect("should create nested dir");

    let files = list_workspace_files(workspace.path()).expect("workspace listing should succeed");
    let names = files.iter().map(|file| file.name.as_str()).collect::<Vec<_>>();

    assert_eq!(names, vec!["a.excalidraw", "b.excalidraw"]);
}

#[test]
fn rejects_missing_directory() {
    let missing_directory = Path::new("C:/this/path/should/not/exist/for/excaliapp-tests");

    let error = list_workspace_files(missing_directory).expect_err("missing directory should fail");

    assert_eq!(error.to_string(), "Directory cannot be read");
}
