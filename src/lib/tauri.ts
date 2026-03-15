import { invoke } from "@tauri-apps/api/core";

import type {
  AppStateResponse,
  CreateDocumentResponse,
  OpenWorkspaceResponse,
  PickDirectoryResponse,
  ReadDocumentResponse,
  SaveDocumentResponse,
} from "../types/tauri";

export async function getAppState(): Promise<AppStateResponse> {
  return invoke<AppStateResponse>("get_app_state");
}

export async function pickDirectory(): Promise<PickDirectoryResponse> {
  return invoke<PickDirectoryResponse>("pick_directory");
}

export async function openWorkspace(
  directory: string,
): Promise<OpenWorkspaceResponse> {
  return invoke<OpenWorkspaceResponse>("open_workspace", {
    request: { directory },
  });
}

export async function readDocument(
  workspaceDirectory: string,
  path: string,
): Promise<ReadDocumentResponse> {
  return invoke<ReadDocumentResponse>("read_document", {
    request: { workspaceDirectory, path },
  });
}

export async function saveDocument(
  workspaceDirectory: string,
  path: string,
  content: string,
): Promise<SaveDocumentResponse> {
  return invoke<SaveDocumentResponse>("save_document", {
    request: { workspaceDirectory, path, content },
  });
}

export async function persistWorkspace(
  lastOpenedDirectory: string | null,
  lastOpenedFile: string | null,
): Promise<AppStateResponse> {
  return invoke<AppStateResponse>("persist_workspace", {
    request: { lastOpenedDirectory, lastOpenedFile },
  });
}

export async function createDocument(
  workspaceDirectory: string,
  fileName: string,
  content: string,
): Promise<CreateDocumentResponse> {
  return invoke<CreateDocumentResponse>("create_document", {
    request: { workspaceDirectory, fileName, content },
  });
}
