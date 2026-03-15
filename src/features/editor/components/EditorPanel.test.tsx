import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("./ExcalidrawEditor", () => ({
  ExcalidrawEditor: () => {
    throw new Error("editor crashed");
  },
}));

import { AppShell } from "../../workspace/components/AppShell";
import { EditorPanel } from "./EditorPanel";

const document = {
  elements: [],
  appState: {},
  files: {},
};

test("keeps the workspace visible when the embedded editor crashes", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

  expect(() => {
    render(
      <AppShell
        currentDirectory="C:/workspace"
        files={[{ name: "diagram.excalidraw", path: "C:/workspace/diagram.excalidraw" }]}
        activeFilePath="C:/workspace/diagram.excalidraw"
        saveStatusLabel="Saved"
        shortcutLabel="Ctrl+S"
        onOpenDirectory={() => undefined}
        onSelectFile={() => undefined}
      >
        <EditorPanel
          loadStatus="loaded"
          errorMessage={null}
          activeFileName="diagram.excalidraw"
          document={document}
          viewKey="diagram"
          onSnapshotChange={() => undefined}
          onApiReady={() => undefined}
        />
      </AppShell>,
    );
  }).not.toThrow();

  expect(screen.getByText("Workspace")).toBeTruthy();
  expect(screen.getByText("File cannot be opened")).toBeTruthy();

  consoleError.mockRestore();
});
