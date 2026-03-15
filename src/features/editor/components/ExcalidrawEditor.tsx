import { useCallback, useEffect, useMemo, useRef } from "react";
import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import "@excalidraw/excalidraw/index.css";

import type { ParsedExcalidrawContent } from "../lib/excalidraw-file";

export type ExcalidrawSnapshot = {
  elements: readonly OrderedExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
};

type ExcalidrawEditorProps = {
  document: ParsedExcalidrawContent;
  viewKey: string;
  onSnapshotChange: (snapshot: ExcalidrawSnapshot) => void;
  onApiReady: (api: ExcalidrawImperativeAPI | null) => void;
};

export function ExcalidrawEditor({
  document,
  viewKey,
  onSnapshotChange,
  onApiReady,
}: ExcalidrawEditorProps) {
  const isHydratingRef = useRef(true);

  useEffect(() => {
    isHydratingRef.current = true;
  }, [viewKey]);

  const initialData = useMemo(
    () => ({
      elements: document.elements,
      appState: document.appState,
      files: document.files,
      scrollToContent: true,
    }),
    [document],
  );

  const handleApiReady = useCallback(
    (api: ExcalidrawImperativeAPI | null) => {
      onApiReady(api);
    },
    [onApiReady],
  );

  const handleChange = useCallback(
    (elements: readonly OrderedExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      if (isHydratingRef.current) {
        isHydratingRef.current = false;
        return;
      }
      // Defer parent state updates to the next macrotask to avoid
      // nested React updates that can trigger "Maximum update depth exceeded".
      window.setTimeout(() => {
        onSnapshotChange({
          elements,
          appState,
          files,
        });
      }, 0);
    },
    [onSnapshotChange],
  );

  return (
    <div className="editor-canvas">
      <Excalidraw
        key={viewKey}
        initialData={initialData}
        excalidrawAPI={handleApiReady}
        onChange={handleChange}
        theme="light"
      >
        <MainMenu>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.SaveToActiveFile />
          <MainMenu.DefaultItems.SearchMenu />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.Separator />
          <MainMenu.DefaultItems.ToggleTheme />
        </MainMenu>
      </Excalidraw>
    </div>
  );
}
