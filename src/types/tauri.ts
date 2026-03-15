export type WorkspaceFileSummary = {
  name: string;
  path: string;
};

export type AppStateResponse = {
  lastOpenedDirectory: string | null;
  lastOpenedFile: string | null;
};

export type OpenWorkspaceResponse = {
  directory: string;
  files: WorkspaceFileSummary[];
};

export type PickDirectoryResponse = {
  directory: string | null;
};

export type ReadDocumentResponse = {
  path: string;
  content: string;
};

export type SaveDocumentResponse = {
  path: string;
};
