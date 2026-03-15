import "./App.css";

import { EditorPanel } from "./features/editor/components/EditorPanel";
import { AppShell } from "./features/workspace/components/AppShell";
import { useWorkspaceController } from "./features/workspace/hooks/useWorkspaceController";

function App() {
  const {
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
  } = useWorkspaceController();

  return (
    <AppShell
      currentDirectory={state.currentDirectory}
      files={state.fileList}
      activeFilePath={state.activeFilePath}
      saveStatusLabel={saveStatusLabel}
      shortcutLabel={shortcutLabel}
      onOpenDirectory={() => {
        void handleOpenDirectory();
      }}
      onSelectFile={(path) => {
        void handleSelectFile(path);
      }}
    >
      <EditorPanel
        loadStatus={state.loadStatus}
        errorMessage={activeErrorMessage}
        activeFileName={state.activeFileName}
        document={activeDocument}
        viewKey={viewKey}
        onSnapshotChange={handleSnapshotChange}
        onApiReady={handleApiReady}
      />
    </AppShell>
  );
}

export default App;
