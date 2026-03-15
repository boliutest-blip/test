use tempfile::tempdir;

use excaliapp_lib::services::document_service::{read_document, save_document};

#[test]
fn reads_and_writes_document_within_workspace() {
    let workspace = tempdir().expect("workspace tempdir should be created");
    let file_path = workspace.path().join("diagram.excalidraw");

    std::fs::write(&file_path, "{\"type\":\"excalidraw\"}").expect("seed file should be written");

    save_document(workspace.path(), &file_path, "{\"type\":\"excalidraw\",\"version\":2}")
        .expect("save should succeed");

    let document = read_document(workspace.path(), &file_path).expect("read should succeed");

    assert_eq!(document, "{\"type\":\"excalidraw\",\"version\":2}");
}

#[test]
fn rejects_saving_outside_workspace() {
    let workspace = tempdir().expect("workspace tempdir should be created");
    let outside_parent = tempdir().expect("outside tempdir should be created");
    let outside_file = outside_parent.path().join("outside.excalidraw");

    std::fs::write(&outside_file, "{}").expect("outside file should be written");

    let error = save_document(workspace.path(), &outside_file, "{\"type\":\"excalidraw\"}")
        .expect_err("save outside workspace should fail");

    assert_eq!(error.to_string(), "Document is outside the current workspace");
}
