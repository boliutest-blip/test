import type { AppState, BinaryFiles, Collaborator, SocketId } from "@excalidraw/excalidraw/types";
import type {
  ExcalidrawElement,
  OrderedExcalidrawElement,
} from "@excalidraw/excalidraw/element/types";

export type ExcalidrawDocumentSnapshot = {
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
};

export type ParsedExcalidrawContent = {
  elements: OrderedExcalidrawElement[];
  appState: Partial<AppState>;
  files: BinaryFiles;
};

export const FILE_OPEN_ERROR_MESSAGE = "File cannot be opened";

function normalizeCollaborators(
  collaborators: unknown,
): Map<SocketId, Collaborator> | undefined {
  if (collaborators instanceof Map) {
    return collaborators as Map<SocketId, Collaborator>;
  }

  if (collaborators === undefined) {
    return undefined;
  }

  if (typeof collaborators !== "object" || collaborators === null) {
    return new Map();
  }

  return new Map(Object.entries(collaborators) as [SocketId, Collaborator][]);
}

function normalizeAppState(appState: Partial<AppState>): Partial<AppState> {
  return {
    ...appState,
    collaborators: normalizeCollaborators(appState.collaborators),
  };
}

function sanitizeAppStateForSave(appState: Partial<AppState>): Record<string, unknown> {
  const {
    collaborators: _collaborators,
    offsetLeft: _offsetLeft,
    offsetTop: _offsetTop,
    width: _width,
    height: _height,
    contextMenu: _contextMenu,
    activeEmbeddable: _activeEmbeddable,
    newElement: _newElement,
    resizingElement: _resizingElement,
    multiElement: _multiElement,
    selectionElement: _selectionElement,
    startBoundElement: _startBoundElement,
    suggestedBindings: _suggestedBindings,
    frameToHighlight: _frameToHighlight,
    editingFrame: _editingFrame,
    elementsToHighlight: _elementsToHighlight,
    editingTextElement: _editingTextElement,
    editingLinearElement: _editingLinearElement,
    currentHoveredFontFamily: _currentHoveredFontFamily,
    openPopup: _openPopup,
    openDialog: _openDialog,
    hoveredElementIds: _hoveredElementIds,
    selectedElementsAreBeingDragged: _selectedElementsAreBeingDragged,
    toast: _toast,
    fileHandle: _fileHandle,
    selectedLinearElement: _selectedLinearElement,
    pendingImageElementId: _pendingImageElementId,
    userToFollow: _userToFollow,
    followedBy: _followedBy,
    isCropping: _isCropping,
    croppingElementId: _croppingElementId,
    searchMatches: _searchMatches,
    snapLines: _snapLines,
    originSnapOffset: _originSnapOffset,
    ...persistedAppState
  } = appState;

  return persistedAppState;
}

export async function parseExcalidrawContent(
  content: string,
): Promise<ParsedExcalidrawContent> {
  try {
    const parsed = JSON.parse(content) as {
      type?: unknown;
      elements?: unknown;
      appState?: unknown;
      files?: unknown;
    };

    if (
      parsed.type !== "excalidraw" ||
      !Array.isArray(parsed.elements) ||
      typeof parsed.appState !== "object" ||
      parsed.appState === null ||
      typeof parsed.files !== "object" ||
      parsed.files === null
    ) {
      throw new Error(FILE_OPEN_ERROR_MESSAGE);
    }

    return {
      elements: parsed.elements as OrderedExcalidrawElement[],
      appState: normalizeAppState(parsed.appState as Partial<AppState>),
      files: parsed.files as BinaryFiles,
    };
  } catch {
    throw new Error(FILE_OPEN_ERROR_MESSAGE);
  }
}

export function serializeExcalidrawContent(
  snapshot: ExcalidrawDocumentSnapshot,
): string {
  return JSON.stringify({
    type: "excalidraw",
    version: 2,
    source: "excaliapp",
    elements: snapshot.elements,
    appState: sanitizeAppStateForSave(snapshot.appState),
    files: snapshot.files,
  });
}
