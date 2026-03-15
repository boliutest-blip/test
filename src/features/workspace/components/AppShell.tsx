import type { ReactNode } from "react";

import type { WorkspaceFileSummary } from "../../workspace/hooks/workspace-controller";

type AppShellProps = {
  currentDirectory: string | null;
  files: WorkspaceFileSummary[];
  activeFilePath: string | null;
  saveStatusLabel: string;
  shortcutLabel: string;
  onOpenDirectory: () => void;
  onSelectFile: (path: string) => void;
  children: ReactNode;
};

export function AppShell({
  currentDirectory,
  files,
  activeFilePath,
  saveStatusLabel,
  shortcutLabel,
  onOpenDirectory,
  onSelectFile,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-app-header">
          <div className="sidebar-app-meta">
            <span className="sidebar-app-name">
              {currentDirectory ? currentDirectory.split(/[/\\]/).pop() : "Workspace"}
            </span>
          </div>
          <button
            type="button"
            className="sidebar-new-file"
            onClick={onOpenDirectory}
          >
            + New File
          </button>
        </div>

        <div className="sidebar-body">
          {currentDirectory === null ? (
            <div className="sidebar-state">
              Choose a local directory to browse `.excalidraw` files.
            </div>
          ) : files.length === 0 ? (
            <div className="sidebar-state">
              No `.excalidraw` files were found in this directory.
            </div>
          ) : (
            <ul className="file-list">
              {files.map((file) => (
                <li key={file.path}>
                  <button
                    type="button"
                    className={
                      file.path === activeFilePath ? "file-button active" : "file-button"
                    }
                    onClick={() => onSelectFile(file.path)}
                  >
                    <span className="file-icon" aria-hidden="true">
                      <span className="file-icon-sheet" />
                    </span>
                    <span className="file-name">{file.name}</span>
                    <span className="file-chevron" aria-hidden="true">
                      ▸
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="sidebar-footer">
          <span className="sidebar-footer-count">
            {files.length} {files.length === 1 ? "file" : "files"}
          </span>
        </footer>
      </aside>
      <main className="content">
        <header className="topbar">
          <div>
            <p className="topbar-label">Status</p>
            <strong>{saveStatusLabel}</strong>
          </div>
          <div className="topbar-shortcut">Save: {shortcutLabel}</div>
        </header>
        <section className="editor-panel">{children}</section>
      </main>
    </div>
  );
}
