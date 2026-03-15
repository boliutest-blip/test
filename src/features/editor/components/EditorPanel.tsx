import { Component, type ErrorInfo, type ReactNode } from "react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import type { ParsedExcalidrawContent } from "../lib/excalidraw-file";
import { ExcalidrawEditor, type ExcalidrawSnapshot } from "./ExcalidrawEditor";

type EditorPanelProps = {
  loadStatus: "idle" | "loading" | "loaded" | "error";
  errorMessage: string | null;
  activeFileName: string | null;
  document: ParsedExcalidrawContent | null;
  viewKey: string | null;
  onSnapshotChange: (snapshot: ExcalidrawSnapshot) => void;
  onApiReady: (api: ExcalidrawImperativeAPI | null) => void;
};

type EditorErrorBoundaryProps = {
  resetKey: string;
  children: ReactNode;
};

type EditorErrorBoundaryState = {
  hasError: boolean;
};

class EditorErrorBoundary extends Component<
  EditorErrorBoundaryProps,
  EditorErrorBoundaryState
> {
  override state: EditorErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): EditorErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  override componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    return;
  }

  override componentDidUpdate(previousProps: EditorErrorBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="editor-state editor-state-error">
          <h2>File cannot be opened</h2>
          <p>The embedded editor failed to render this document.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export function EditorPanel({
  loadStatus,
  errorMessage,
  activeFileName,
  document,
  viewKey,
  onSnapshotChange,
  onApiReady,
}: EditorPanelProps) {
  if (loadStatus === "loading") {
    return <div className="editor-state">Loading file…</div>;
  }

  if (loadStatus === "error") {
    return (
      <div className="editor-state editor-state-error">
        <h2>File cannot be opened</h2>
        <p>{errorMessage ?? "The selected file could not be parsed."}</p>
      </div>
    );
  }

  if (!document || !viewKey) {
    return (
      <div className="editor-state">
        <h2>{activeFileName ? "Ready to load" : "No file selected"}</h2>
        <p>
          {activeFileName
            ? "Select a file from the sidebar to load it into the editor."
            : "Choose a directory and select an .excalidraw file to start editing."}
        </p>
      </div>
    );
  }

  return (
    <EditorErrorBoundary resetKey={viewKey}>
      <ExcalidrawEditor
        document={document}
        viewKey={viewKey}
        onSnapshotChange={onSnapshotChange}
        onApiReady={onApiReady}
      />
    </EditorErrorBoundary>
  );
}
