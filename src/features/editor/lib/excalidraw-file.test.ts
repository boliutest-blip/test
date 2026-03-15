import type { BinaryFiles } from "@excalidraw/excalidraw/types";

import { parseExcalidrawContent, serializeExcalidrawContent } from "./excalidraw-file";

describe("excalidraw file helpers", () => {
  it("serializes a scene into excalidraw JSON", () => {
    const json = serializeExcalidrawContent({
      elements: [],
      appState: {},
      files: {} satisfies BinaryFiles,
    });

    expect(json).toContain('"type":"excalidraw"');
  });

  it("omits runtime-only appState fields when saving", () => {
    const json = serializeExcalidrawContent({
      elements: [],
      appState: {
        collaborators: new Map(),
        offsetLeft: 10,
        offsetTop: 20,
        width: 300,
        height: 200,
        viewBackgroundColor: "#ffffff",
      },
      files: {} satisfies BinaryFiles,
    });

    expect(json).not.toContain('"collaborators"');
    expect(json).not.toContain('"offsetLeft"');
    expect(json).not.toContain('"offsetTop"');
    expect(json).not.toContain('"width"');
    expect(json).not.toContain('"height"');
    expect(json).toContain('"viewBackgroundColor":"#ffffff"');
  });

  it("parses a valid excalidraw document", async () => {
    const result = await parseExcalidrawContent(
      '{"type":"excalidraw","version":2,"source":"test","elements":[],"appState":{},"files":{}}',
    );

    expect(result.elements).toEqual([]);
    expect(result.appState).toBeDefined();
    expect(result.files).toEqual({});
  });

  it("normalizes collaborators into a map when loading saved JSON", async () => {
    const result = await parseExcalidrawContent(
      '{"type":"excalidraw","version":2,"source":"test","elements":[],"appState":{"collaborators":{}},"files":{}}',
    );

    expect(result.appState.collaborators).toBeInstanceOf(Map);
    expect(result.appState.collaborators?.size).toBe(0);
  });

  it("rejects invalid excalidraw content", async () => {
    await expect(parseExcalidrawContent("not json")).rejects.toThrow(
      "File cannot be opened",
    );
  });
});
