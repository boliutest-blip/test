export type SaveStatus = "idle" | "saving" | "saved" | "error";
export type LoadStatus = "idle" | "loading" | "loaded" | "error";

export type WorkspaceFileSummary = {
  name: string;
  path: string;
};

export type PendingNavigation =
  | { type: "file"; targetPath: string }
  | { type: "directory"; targetDirectory: string }
  | null;

export type WorkspaceState = {
  currentDirectory: string | null;
  fileList: WorkspaceFileSummary[];
  activeFilePath: string | null;
  activeFileName: string | null;
  isDirty: boolean;
  saveStatus: SaveStatus;
  loadStatus: LoadStatus;
  documentRevision: number;
  lastSavedRevision: number;
  pendingNavigation: PendingNavigation;
};

export function createInitialWorkspaceState(): WorkspaceState {
  return {
    currentDirectory: null,
    fileList: [],
    activeFilePath: null,
    activeFileName: null,
    isDirty: false,
    saveStatus: "idle",
    loadStatus: "idle",
    documentRevision: 0,
    lastSavedRevision: 0,
    pendingNavigation: null,
  };
}

export function queueFileSelection(
  state: WorkspaceState,
  targetPath: string,
): WorkspaceState {
  if (state.activeFilePath === targetPath && state.pendingNavigation === null) {
    return state;
  }

  if (state.saveStatus === "saving" || state.isDirty) {
    return {
      ...state,
      saveStatus: "saving",
      pendingNavigation: {
        type: "file",
        targetPath,
      },
    };
  }

  const targetFile = state.fileList.find((file) => file.path === targetPath) ?? null;

  return {
    ...state,
    activeFilePath: targetPath,
    activeFileName: targetFile?.name ?? null,
    loadStatus: "loading",
  };
}

export function markDocumentSaved(
  state: WorkspaceState,
  savedRevision: number,
): WorkspaceState {
  const isDirty = state.documentRevision > savedRevision;

  return {
    ...state,
    lastSavedRevision: savedRevision,
    isDirty,
    saveStatus: isDirty ? "idle" : "saved",
  };
}

export function startNavigationAfterSave(state: WorkspaceState): WorkspaceState {
  const pendingNavigation = state.pendingNavigation;
  if (pendingNavigation?.type !== "file") {
    return state;
  }

  const targetFile =
    state.fileList.find((file) => file.path === pendingNavigation.targetPath) ?? null;

  return {
    ...state,
    activeFilePath: pendingNavigation.targetPath,
    activeFileName: targetFile?.name ?? null,
    pendingNavigation: null,
    loadStatus: "loading",
  };
}
