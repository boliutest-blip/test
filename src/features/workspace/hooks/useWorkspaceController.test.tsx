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

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return { promise, resolve, reject };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("useWorkspaceController", () => {
  it("keeps the loaded document when persisting the active file fails", async () => {
    eventMocks.listenToMenuEvent.mockResolvedValue(() => undefined);
    const persistDeferred = createDeferred<{ lastOpenedDirectory: string | null; lastOpenedFile: string | null }>();

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
    eventMocks.listenToMenuEvent.mockResolvedValue(() => undefined);
    const firstRead = createDeferred<{ content: string }>();
    const secondRead = createDeferred<{ content: string }>();

    tauriMocks.getAppState.mockResolvedValue({
      lastOpenedDirectory: null,
      lastOpenedFile: null,
    });
    tauriMocks.persistWorkspace.mockResolvedValue({
      lastOpenedDirectory: "C:/workspace",
      lastOpenedFile: "C:/workspace/b.excalidraw",
    });
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
});
