import {
  createInitialWorkspaceState,
  markDocumentSaved,
  queueFileSelection,
  startNavigationAfterSave,
  type WorkspaceState,
} from "./workspace-controller";

function createDirtyState(): WorkspaceState {
  return {
    ...createInitialWorkspaceState(),
    currentDirectory: "C:/workspace",
    fileList: [
      { name: "a.excalidraw", path: "C:/workspace/a.excalidraw" },
      { name: "b.excalidraw", path: "C:/workspace/b.excalidraw" },
      { name: "c.excalidraw", path: "C:/workspace/c.excalidraw" },
    ],
    activeFilePath: "C:/workspace/a.excalidraw",
    activeFileName: "a.excalidraw",
    isDirty: true,
    documentRevision: 2,
    lastSavedRevision: 1,
  };
}

describe("workspace controller", () => {
  it("queues file navigation and enters saving state when current file is dirty", () => {
    const nextState = queueFileSelection(createDirtyState(), "C:/workspace/b.excalidraw");

    expect(nextState.pendingNavigation).toEqual({
      type: "file",
      targetPath: "C:/workspace/b.excalidraw",
    });
    expect(nextState.saveStatus).toBe("saving");
    expect(nextState.activeFilePath).toBe("C:/workspace/a.excalidraw");
  });

  it("keeps only the latest queued file navigation while a save is in progress", () => {
    const savingState: WorkspaceState = {
      ...createDirtyState(),
      saveStatus: "saving",
      pendingNavigation: {
        type: "file",
        targetPath: "C:/workspace/b.excalidraw",
      },
    };

    const nextState = queueFileSelection(savingState, "C:/workspace/c.excalidraw");

    expect(nextState.pendingNavigation).toEqual({
      type: "file",
      targetPath: "C:/workspace/c.excalidraw",
    });
    expect(nextState.activeFilePath).toBe("C:/workspace/a.excalidraw");
  });

  it("does not clear dirty state when a newer revision exists after save completes", () => {
    const state: WorkspaceState = {
      ...createDirtyState(),
      saveStatus: "saving",
      documentRevision: 3,
      pendingNavigation: {
        type: "file",
        targetPath: "C:/workspace/b.excalidraw",
      },
    };

    const savedState = markDocumentSaved(state, 2);

    expect(savedState.isDirty).toBe(true);
    expect(savedState.lastSavedRevision).toBe(2);
  });

  it("starts loading the queued file only after save succeeds", () => {
    const state: WorkspaceState = {
      ...createDirtyState(),
      saveStatus: "saved",
      isDirty: false,
      lastSavedRevision: 2,
      pendingNavigation: {
        type: "file",
        targetPath: "C:/workspace/b.excalidraw",
      },
    };

    const nextState = startNavigationAfterSave(state);

    expect(nextState.activeFilePath).toBe("C:/workspace/b.excalidraw");
    expect(nextState.activeFileName).toBe("b.excalidraw");
    expect(nextState.pendingNavigation).toBeNull();
    expect(nextState.loadStatus).toBe("loading");
  });
});
