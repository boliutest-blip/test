import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const tauriMocks = vi.hoisted(() => ({
  getAppState: vi.fn(),
  pickDirectory: vi.fn(),
  openWorkspace: vi.fn(),
  readDocument: vi.fn(),
  saveDocument: vi.fn(),
  persistWorkspace: vi.fn(),
}));

const eventMocks = vi.hoisted(() => ({
  listenToMenuEvent: vi.fn(),
}));

vi.mock("../../../lib/tauri", () => tauriMocks);
vi.mock("../../../lib/events", () => ({
  MENU_EVENT_OPEN_DIRECTORY: "menu://open-directory",
  MENU_EVENT_SAVE: "menu://save",
  listenToMenuEvent: eventMocks.listenToMenuEvent,
}));

import { useWorkspaceController } from "./useWorkspaceController";

const MENU_EVENT_OPEN_DIRECTORY = "menu://open-directory";
const MENU_EVENT_SAVE = "menu://save";

type AppState = { lastOpenedDirectory: string | null; lastOpenedFile: string | null };

function createDocumentContent(id: string): string {
  return JSON.stringify({
    type: "excalidraw",
    version: 2,
    source: "test",
    elements: [{ id }],
    appState: {},
    files: {},
  });
}

function createSnapshot(id: string) {
  return {
    elements: [{ id }],
    appState: {},
    files: {},
  } as never;
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return { promise, resolve, reject };
}

function mockMenuBridge() {
  const callbacks = new Map<string, () => void>();
  eventMocks.listenToMenuEvent.mockImplementation(
    async (eventName: string, callback: () => void) => {
      callbacks.set(eventName, callback);
      return () => {
        callbacks.delete(eventName);
      };
    },
  );

  return {
    trigger(eventName: string) {
      const callback = callbacks.get(eventName);
      if (!callback) {
        throw new Error(`Missing menu listener for ${eventName}`);
      }
      callback();
    },
  };
}

function mockPersistSuccess() {
  tauriMocks.persistWorkspace.mockImplementation(
    async (lastOpenedDirectory: string | null, lastOpenedFile: string | null) =>
      ({
        lastOpenedDirectory,
        lastOpenedFile,
      }) as AppState,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("useWorkspaceController", () => {
  it("keeps the loaded document when persisting the active file fails", async () => {
    mockMenuBridge();
    const persistDeferred = createDeferred<AppState>();

    tauriMocks.getAppState.mockResolvedValue({
      lastOpenedDirectory: "C:/workspace",
      lastOpenedFile: "C:/workspace/a.excalidraw",
    });
    tauriMocks.openWorkspace.mockResolvedValue({
      directory: "C:/workspace",
      files: [{ name: "a.excalidraw", path: "C:/workspace/a.excalidraw" }],
    });
    tauriMocks.readDocument.mockResolvedValue({
      content: createDocumentContent("a"),
    });
    tauriMocks.persistWorkspace.mockImplementation(() => persistDeferred.promise);

    const { result } = renderHook(() => useWorkspaceController());

    await waitFor(() => {
      expect(result.current.activeDocument).not.toBeNull();
    });

    act(() => {
      persistDeferred.reject(new Error("Settings cannot be saved"));
    });

    await act(async () => {
      try {
        await persistDeferred.promise;
      } catch {
        return;
      }
    });

    expect(result.current.activeDocument).not.toBeNull();
    expect(result.current.state.loadStatus).toBe("loaded");
    expect(result.current.state.activeFilePath).toBe("C:/workspace/a.excalidraw");
  });

  it("ignores stale file loads when a newer selection finishes first", async () => {
    mockMenuBridge();
    const firstRead = createDeferred<{ content: string }>();
    const secondRead = createDeferred<{ content: string }>();

    tauriMocks.getAppState.mockResolvedValue({
      lastOpenedDirectory: null,
      lastOpenedFile: null,
    });
    mockPersistSuccess();
    tauriMocks.pickDirectory.mockResolvedValue({ directory: "C:/workspace" });
    tauriMocks.openWorkspace.mockResolvedValue({
      directory: "C:/workspace",
      files: [],
    });
    tauriMocks.readDocument.mockImplementation((_: string, path: string) => {
      if (path === "C:/workspace/a.excalidraw") {
        return firstRead.promise;
      }

      return secondRead.promise;
    });

    const { result } = renderHook(() => useWorkspaceController());

    await act(async () => {
      await result.current.handleOpenDirectory();
    });

    let firstSelection: Promise<void>;
    let secondSelection: Promise<void>;

    await act(async () => {
      firstSelection = result.current.handleSelectFile("C:/workspace/a.excalidraw");
      secondSelection = result.current.handleSelectFile("C:/workspace/b.excalidraw");

      secondRead.resolve({ content: createDocumentContent("b") });
      await secondSelection;

      firstRead.resolve({ content: createDocumentContent("a") });
      await firstSelection;
    });

    await waitFor(() => {
      expect(result.current.state.activeFilePath).toBe("C:/workspace/b.excalidraw");
    });

    expect(result.current.activeDocument?.elements[0]?.id).toBe("b");
  });

  it("saves first before menu-triggered directory switch when document is dirty", async () => {
    const menuBridge = mockMenuBridge();

    tauriMocks.getAppState.mockResolvedValue({
      lastOpenedDirectory: "C:/workspace-old",
      lastOpenedFile: "C:/workspace-old/old.excalidraw",
    });
    tauriMocks.openWorkspace
      .mockResolvedValueOnce({
        directory: "C:/workspace-old",
        files: [{ name: "old.excalidraw", path: "C:/workspace-old/old.excalidraw" }],
      })
      .mockResolvedValueOnce({
        directory: "C:/workspace-new",
        files: [{ name: "new.excalidraw", path: "C:/workspace-new/new.excalidraw" }],
      });
    tauriMocks.readDocument
      .mockResolvedValueOnce({ content: createDocumentContent("old") })
      .mockResolvedValueOnce({ content: createDocumentContent("new") });
    tauriMocks.pickDirectory.mockResolvedValue({ directory: "C:/workspace-new" });
    tauriMocks.saveDocument.mockResolvedValue({ path: "C:/workspace-old/old.excalidraw" });
    mockPersistSuccess();

    const { result } = renderHook(() => useWorkspaceController());

    await waitFor(() => {
      expect(result.current.state.activeFilePath).toBe("C:/workspace-old/old.excalidraw");
    });

    act(() => {
      result.current.handleSnapshotChange(createSnapshot("dirty-old"));
    });

    await waitFor(() => {
      expect(result.current.state.isDirty).toBe(true);
    });

    act(() => {
      menuBridge.trigger(MENU_EVENT_OPEN_DIRECTORY);
    });

    await waitFor(() => {
      expect(result.current.state.currentDirectory).toBe("C:/workspace-new");
      expect(result.current.state.activeFilePath).toBe("C:/workspace-new/new.excalidraw");
    });

    expect(tauriMocks.saveDocument).toHaveBeenCalledTimes(1);
    const saveOrder = tauriMocks.saveDocument.mock.invocationCallOrder[0];
    const pickOrder = tauriMocks.pickDirectory.mock.invocationCallOrder[0];
    const openNewWorkspaceOrder = tauriMocks.openWorkspace.mock.invocationCallOrder[1];
    expect(saveOrder).toBeLessThan(pickOrder);
    expect(pickOrder).toBeLessThan(openNewWorkspaceOrder);
  });

  it("does not switch directory when save fails during menu-triggered open", async () => {
    const menuBridge = mockMenuBridge();

    tauriMocks.getAppState.mockResolvedValue({
      lastOpenedDirectory: "C:/workspace-old",
      lastOpenedFile: "C:/workspace-old/old.excalidraw",
    });
    tauriMocks.openWorkspace.mockResolvedValue({
      directory: "C:/workspace-old",
      files: [{ name: "old.excalidraw", path: "C:/workspace-old/old.excalidraw" }],
    });
    tauriMocks.readDocument.mockResolvedValue({ content: createDocumentContent("old") });
    tauriMocks.saveDocument.mockRejectedValue(new Error("Document cannot be saved"));
    tauriMocks.pickDirectory.mockResolvedValue({ directory: "C:/workspace-new" });
    mockPersistSuccess();

    const { result } = renderHook(() => useWorkspaceController());

    await waitFor(() => {
      expect(result.current.state.activeFilePath).toBe("C:/workspace-old/old.excalidraw");
    });

    act(() => {
      result.current.handleSnapshotChange(createSnapshot("dirty-old"));
    });

    await waitFor(() => {
      expect(result.current.state.isDirty).toBe(true);
    });

    act(() => {
      menuBridge.trigger(MENU_EVENT_OPEN_DIRECTORY);
    });

    await waitFor(() => {
      expect(tauriMocks.saveDocument).toHaveBeenCalledTimes(1);
    });

    expect(tauriMocks.pickDirectory).not.toHaveBeenCalled();
    expect(result.current.state.currentDirectory).toBe("C:/workspace-old");
    expect(result.current.activeErrorMessage).toBe("Document cannot be saved");
  });

  it("shows a clear error when menu-triggered directory picker fails", async () => {
    const menuBridge = mockMenuBridge();

    tauriMocks.getAppState.mockResolvedValue({
      lastOpenedDirectory: null,
      lastOpenedFile: null,
    });
    tauriMocks.pickDirectory.mockRejectedValue(new Error("Directory picker failed"));
    tauriMocks.openWorkspace.mockResolvedValue({
      directory: "C:/workspace",
      files: [{ name: "a.excalidraw", path: "C:/workspace/a.excalidraw" }],
    });
    tauriMocks.readDocument.mockResolvedValue({ content: createDocumentContent("a") });
    mockPersistSuccess();

    const { result } = renderHook(() => useWorkspaceController());

    act(() => {
      menuBridge.trigger(MENU_EVENT_OPEN_DIRECTORY);
    });

    await waitFor(() => {
      expect(result.current.state.loadStatus).toBe("error");
      expect(result.current.activeErrorMessage).toBe("Directory picker failed");
    });

    expect(tauriMocks.openWorkspace).not.toHaveBeenCalled();
  });

  it("shows a clear error when menu-triggered workspace open fails", async () => {
    const menuBridge = mockMenuBridge();

    tauriMocks.getAppState.mockResolvedValue({
      lastOpenedDirectory: null,
      lastOpenedFile: null,
    });
    tauriMocks.pickDirectory.mockResolvedValue({ directory: "C:/workspace-new" });
    tauriMocks.openWorkspace.mockRejectedValue(new Error("Directory cannot be read"));
    mockPersistSuccess();

    const { result } = renderHook(() => useWorkspaceController());

    act(() => {
      menuBridge.trigger(MENU_EVENT_OPEN_DIRECTORY);
    });

    await waitFor(() => {
      expect(result.current.state.loadStatus).toBe("error");
      expect(result.current.activeErrorMessage).toBe("Directory cannot be read");
    });
  });

  it("keeps new workspace loaded when persistence fails after a successful menu-triggered switch", async () => {
    const menuBridge = mockMenuBridge();

    tauriMocks.getAppState.mockResolvedValue({
      lastOpenedDirectory: null,
      lastOpenedFile: null,
    });
    tauriMocks.pickDirectory.mockResolvedValue({ directory: "C:/workspace-new" });
    tauriMocks.openWorkspace.mockResolvedValue({
      directory: "C:/workspace-new",
      files: [{ name: "new.excalidraw", path: "C:/workspace-new/new.excalidraw" }],
    });
    tauriMocks.readDocument.mockResolvedValue({ content: createDocumentContent("new") });
    tauriMocks.persistWorkspace.mockImplementation(
      async (lastOpenedDirectory: string | null, lastOpenedFile: string | null) => {
        if (lastOpenedDirectory === "C:/workspace-new" && lastOpenedFile === null) {
          throw new Error("Settings cannot be saved");
        }

        return {
          lastOpenedDirectory,
          lastOpenedFile,
        } as AppState;
      },
    );

    const { result } = renderHook(() => useWorkspaceController());

    act(() => {
      menuBridge.trigger(MENU_EVENT_OPEN_DIRECTORY);
    });

    await waitFor(() => {
      expect(result.current.state.currentDirectory).toBe("C:/workspace-new");
      expect(result.current.state.activeFilePath).toBe("C:/workspace-new/new.excalidraw");
      expect(result.current.state.loadStatus).toBe("loaded");
      expect(result.current.activeDocument).not.toBeNull();
    });

    expect(result.current.activeErrorMessage).toBe("Settings cannot be saved");
  });

  it("routes menu-triggered save through the standard save workflow", async () => {
    const menuBridge = mockMenuBridge();

    tauriMocks.getAppState.mockResolvedValue({
      lastOpenedDirectory: "C:/workspace",
      lastOpenedFile: "C:/workspace/a.excalidraw",
    });
    tauriMocks.openWorkspace.mockResolvedValue({
      directory: "C:/workspace",
      files: [{ name: "a.excalidraw", path: "C:/workspace/a.excalidraw" }],
    });
    tauriMocks.readDocument.mockResolvedValue({ content: createDocumentContent("a") });
    tauriMocks.saveDocument.mockResolvedValue({ path: "C:/workspace/a.excalidraw" });
    mockPersistSuccess();

    const { result } = renderHook(() => useWorkspaceController());

    await waitFor(() => {
      expect(result.current.state.activeFilePath).toBe("C:/workspace/a.excalidraw");
    });

    act(() => {
      result.current.handleSnapshotChange(createSnapshot("dirty-a"));
    });

    await waitFor(() => {
      expect(result.current.state.isDirty).toBe(true);
    });

    act(() => {
      menuBridge.trigger(MENU_EVENT_SAVE);
    });

    await waitFor(() => {
      expect(tauriMocks.saveDocument).toHaveBeenCalledTimes(1);
      expect(result.current.state.saveStatus).toBe("saved");
      expect(result.current.state.isDirty).toBe(false);
    });

    expect(tauriMocks.saveDocument).toHaveBeenCalledWith(
      "C:/workspace",
      "C:/workspace/a.excalidraw",
      expect.any(String),
    );
  });
});
