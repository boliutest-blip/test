import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import {
  listenToMenuEvent,
  MENU_EVENT_OPEN_DIRECTORY,
  MENU_EVENT_SAVE,
} from "../../../lib/events";
import { getSaveShortcutLabel, isSaveShortcut } from "../../../lib/shortcuts";
import {
  getAppState,
  openWorkspace,
  persistWorkspace,
  pickDirectory,
  readDocument,
  saveDocument,
} from "../../../lib/tauri";
import {
  FILE_OPEN_ERROR_MESSAGE,
  parseExcalidrawContent,
  serializeExcalidrawContent,
  type ParsedExcalidrawContent,
} from "../../editor/lib/excalidraw-file";
import type { ExcalidrawSnapshot } from "../../editor/components/ExcalidrawEditor";
import {
  createInitialWorkspaceState,
  markDocumentSaved,
  queueFileSelection,
  startNavigationAfterSave,
  type WorkspaceState,
} from "./workspace-controller";

const AUTOSAVE_INTERVAL_MS = 60_000;

type UseWorkspaceControllerResult = {
  state: WorkspaceState;
  activeDocument: ParsedExcalidrawContent | null;
  activeErrorMessage: string | null;
  viewKey: string | null;
  saveStatusLabel: string;
  shortcutLabel: string;
  handleOpenDirectory: () => Promise<void>;
  handleSelectFile: (path: string) => Promise<void>;
  handleSnapshotChange: (snapshot: ExcalidrawSnapshot) => void;
  handleApiReady: (api: ExcalidrawImperativeAPI | null) => void;
  triggerSave: () => Promise<void>;
};

export function useWorkspaceController(): UseWorkspaceControllerResult {
  const [state, setState] = useState<WorkspaceState>(createInitialWorkspaceState);
  const [activeDocument, setActiveDocument] = useState<ParsedExcalidrawContent | null>(null);
  const [activeErrorMessage, setActiveErrorMessage] = useState<string | null>(null);
  const [viewKey, setViewKey] = useState<string | null>(null);
  const [latestSnapshot, setLatestSnapshot] = useState<ExcalidrawSnapshot | null>(null);
  const savePromiseReference = useRef<Promise<void> | null>(null);
  const revisionReference = useRef(0);
  const loadRequestReference = useRef(0);
  const stateReference = useRef<WorkspaceState>(createInitialWorkspaceState());

  const shortcutLabel = useMemo(() => {
    if (typeof navigator === "undefined") {
      return "Ctrl+S";
    }

    return getSaveShortcutLabel(navigator.platform.toLowerCase());
  }, []);

  const saveStatusLabel = useMemo(() => {
    if (state.saveStatus === "saving") {
      return "Saving…";
    }
    if (state.saveStatus === "saved") {
      return "Saved";
    }
    if (state.saveStatus === "error") {
      return "Save failed";
    }
    return state.isDirty ? "Unsaved" : "Saved";
  }, [state.isDirty, state.saveStatus]);

  useEffect(() => {
    stateReference.current = state;
  }, [state]);

  const loadFile = useCallback(
    async (workspaceDirectory: string, path: string) => {
      const loadRequestId = loadRequestReference.current + 1;
      loadRequestReference.current = loadRequestId;
      setState((current) => ({ ...current, loadStatus: "loading" }));
      setActiveErrorMessage(null);

      try {
        const response = await readDocument(workspaceDirectory, path);
        const parsed = await parseExcalidrawContent(response.content);
        if (loadRequestReference.current !== loadRequestId) {
          return;
        }

        const activeFileName =
          stateReference.current.fileList.find((file) => file.path === path)?.name ??
          path.split(/[/\\]/).pop() ??
          path;

        setActiveDocument(parsed);
        setLatestSnapshot({
          elements: parsed.elements,
          appState: parsed.appState,
          files: parsed.files,
        });
        setViewKey(`${path}:${Date.now()}`);
        revisionReference.current = 0;
        setState((current) => ({
          ...current,
          activeFilePath: path,
          activeFileName,
          loadStatus: "loaded",
          saveStatus: "saved",
          isDirty: false,
          documentRevision: 0,
          lastSavedRevision: 0,
        }));

        try {
          await persistWorkspace(workspaceDirectory, path);
        } catch (error) {
          if (loadRequestReference.current !== loadRequestId) {
            return;
          }

          setActiveErrorMessage(
            error instanceof Error ? error.message : "Settings cannot be saved",
          );
        }
      } catch (error) {
        if (loadRequestReference.current !== loadRequestId) {
          return;
        }

        setActiveDocument(null);
        setLatestSnapshot(null);
        setViewKey(null);
        setActiveErrorMessage(
          error instanceof Error ? error.message : FILE_OPEN_ERROR_MESSAGE,
        );
        setState((current) => ({ ...current, loadStatus: "error" }));
      }
    },
    [],
  );

  const processPendingNavigation = useCallback(async () => {
    const currentState = stateReference.current;
    const pending = currentState.pendingNavigation;
    if (!pending || pending.type !== "file" || !currentState.currentDirectory) {
      return;
    }

    const nextState = startNavigationAfterSave({
      ...currentState,
      saveStatus: "saved",
      isDirty: false,
    });
    stateReference.current = nextState;
    setState(nextState);
    await loadFile(currentState.currentDirectory, pending.targetPath);
  }, [loadFile]);

  const triggerSave = useCallback(async () => {
    const currentState = stateReference.current;
    if (!currentState.currentDirectory || !currentState.activeFilePath || !latestSnapshot) {
      return;
    }

    if (savePromiseReference.current) {
      await savePromiseReference.current;
      return;
    }

    const workspaceDirectory = currentState.currentDirectory;
    const activeFilePath = currentState.activeFilePath;
    const snapshotRevision = revisionReference.current;
    const savePromise = (async () => {
      setState((current) => ({ ...current, saveStatus: "saving" }));

      try {
        const content = serializeExcalidrawContent(latestSnapshot);
        await saveDocument(workspaceDirectory, activeFilePath, content);
        setState((current) => {
          const nextState = markDocumentSaved(current, snapshotRevision);
          stateReference.current = nextState;
          return nextState;
        });
      } catch (error) {
        setActiveErrorMessage(
          error instanceof Error ? error.message : "Document cannot be saved",
        );
        setState((current) => {
          const nextState = { ...current, saveStatus: "error" as const, isDirty: true };
          stateReference.current = nextState;
          return nextState;
        });
        throw error;
      } finally {
        savePromiseReference.current = null;
      }
    })();

    savePromiseReference.current = savePromise;
    await savePromise;

    if (stateReference.current.pendingNavigation) {
      await processPendingNavigation();
    }
  }, [latestSnapshot, processPendingNavigation]);

  const handleOpenDirectory = useCallback(async () => {
    if (stateReference.current.isDirty) {
      try {
        await triggerSave();
      } catch {
        return;
      }
    }

    let selection: { directory: string | null };
    try {
      selection = await pickDirectory();
    } catch (error) {
      setActiveErrorMessage(
        error instanceof Error ? error.message : "Directory picker failed",
      );
      setState((current) => ({ ...current, loadStatus: "error" }));
      return;
    }

    if (!selection.directory) {
      return;
    }

    let workspace;
    try {
      workspace = await openWorkspace(selection.directory);
    } catch (error) {
      setActiveErrorMessage(
        error instanceof Error ? error.message : "Directory cannot be read",
      );
      setState((current) => ({ ...current, loadStatus: "error" }));
      return;
    }

    setState((current) => ({
      ...current,
      currentDirectory: workspace.directory,
      fileList: workspace.files,
      activeFilePath: null,
      activeFileName: null,
      loadStatus: "idle",
      saveStatus: "idle",
      pendingNavigation: null,
    }));
    setActiveDocument(null);
    setActiveErrorMessage(null);
    setViewKey(null);
    setLatestSnapshot(null);

    let persistenceErrorMessage: string | null = null;
    try {
      await persistWorkspace(workspace.directory, null);
    } catch (error) {
      persistenceErrorMessage =
        error instanceof Error ? error.message : "Settings cannot be saved";
    }

    if (workspace.files.length > 0) {
      await loadFile(workspace.directory, workspace.files[0].path);
    }

    if (persistenceErrorMessage && stateReference.current.loadStatus !== "error") {
      setActiveErrorMessage(persistenceErrorMessage);
    }
  }, [loadFile, triggerSave]);

  const handleSelectFile = useCallback(
    async (path: string) => {
      const nextState = queueFileSelection(state, path);
      setState(nextState);

      if (state.isDirty || state.saveStatus === "saving") {
        if (state.saveStatus !== "saving") {
          try {
            await triggerSave();
          } catch {
            return;
          }
        }
        return;
      }

      if (!state.currentDirectory) {
        return;
      }

      await loadFile(state.currentDirectory, path);
    },
    [loadFile, state, triggerSave],
  );

  const handleSnapshotChange = useCallback((snapshot: ExcalidrawSnapshot) => {
    revisionReference.current += 1;
    setLatestSnapshot(snapshot);
    setState((current) => ({
      ...current,
      isDirty: true,
      saveStatus: current.saveStatus === "saving" ? current.saveStatus : "idle",
      documentRevision: revisionReference.current,
    }));
  }, []);

  const handleApiReady = useCallback((_api: ExcalidrawImperativeAPI | null) => {
    return;
  }, []);

  useEffect(() => {
    let isMounted = true;

    void getAppState().then(async (appState) => {
      if (!isMounted || !appState.lastOpenedDirectory) {
        return;
      }

      try {
        const workspace = await openWorkspace(appState.lastOpenedDirectory);
        if (!isMounted) {
          return;
        }

        setState((current) => ({
          ...current,
          currentDirectory: workspace.directory,
          fileList: workspace.files,
        }));

        const preferredPath =
          appState.lastOpenedFile &&
          workspace.files.some((file) => file.path === appState.lastOpenedFile)
            ? appState.lastOpenedFile
            : workspace.files[0]?.path;

        if (preferredPath) {
          await loadFile(workspace.directory, preferredPath);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setActiveErrorMessage(
          error instanceof Error ? error.message : "Directory cannot be read",
        );
      }
    });

    return () => {
      isMounted = false;
    };
  }, [loadFile]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSaveShortcut(event)) {
        return;
      }

      event.preventDefault();
      void triggerSave();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [triggerSave]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!state.isDirty || state.saveStatus === "saving") {
        return;
      }

      void triggerSave();
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [state.isDirty, state.saveStatus, triggerSave]);

  useEffect(() => {
    let unlistenOpenDirectory: (() => void) | undefined;
    let unlistenSave: (() => void) | undefined;

    void listenToMenuEvent(MENU_EVENT_OPEN_DIRECTORY, () => {
      void handleOpenDirectory();
    }).then((unlisten) => {
      unlistenOpenDirectory = unlisten;
    });

    void listenToMenuEvent(MENU_EVENT_SAVE, () => {
      void triggerSave();
    }).then((unlisten) => {
      unlistenSave = unlisten;
    });

    return () => {
      unlistenOpenDirectory?.();
      unlistenSave?.();
    };
  }, [handleOpenDirectory, triggerSave]);

  return {
    state,
    activeDocument,
    activeErrorMessage,
    viewKey,
    saveStatusLabel,
    shortcutLabel,
    handleOpenDirectory,
    handleSelectFile,
    handleSnapshotChange,
    handleApiReady,
    triggerSave,
  };
}
