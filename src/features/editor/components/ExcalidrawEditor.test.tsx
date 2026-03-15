import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const excalidrawSpy = vi.fn();
const menuSpy = vi.fn();
const groupSpy = vi.fn();
const separatorSpy = vi.fn();
const loadSceneSpy = vi.fn();
const saveToActiveFileSpy = vi.fn();
const searchMenuSpy = vi.fn();
const clearCanvasSpy = vi.fn();
const toggleThemeSpy = vi.fn();

vi.mock("@excalidraw/excalidraw", () => {
  const MainMenu = Object.assign(
    ({ children }: { children?: React.ReactNode }) => {
      menuSpy();
      return <div data-testid="main-menu">{children}</div>;
    },
    {
      Group: ({ children }: { children?: React.ReactNode }) => {
        groupSpy();
        return <div data-testid="menu-group">{children}</div>;
      },
      Separator: () => {
        separatorSpy();
        return <div data-testid="menu-separator" />;
      },
      DefaultItems: {
        LoadScene: () => {
          loadSceneSpy();
          return <div>Load scene</div>;
        },
        SaveToActiveFile: () => {
          saveToActiveFileSpy();
          return <div>Save to active file</div>;
        },
        SearchMenu: () => {
          searchMenuSpy();
          return <div>Search</div>;
        },
        ClearCanvas: () => {
          clearCanvasSpy();
          return <div>Clear canvas</div>;
        },
        ToggleTheme: () => {
          toggleThemeSpy();
          return <div>Toggle theme</div>;
        },
      },
    },
  );

  return {
    Excalidraw: ({ children }: { children?: React.ReactNode }) => {
      excalidrawSpy();
      return <div data-testid="excalidraw-root">{children}</div>;
    },
    MainMenu,
  };
});

import { ExcalidrawEditor } from "./ExcalidrawEditor";

describe("ExcalidrawEditor", () => {
  it("provides an explicit host main menu to Excalidraw", () => {
    render(
      <ExcalidrawEditor
        document={{ elements: [], appState: {}, files: {} }}
        viewKey="view"
        onSnapshotChange={() => undefined}
        onApiReady={() => undefined}
      />,
    );

    expect(excalidrawSpy).toHaveBeenCalled();
    expect(menuSpy).toHaveBeenCalled();
    expect(loadSceneSpy).toHaveBeenCalled();
    expect(saveToActiveFileSpy).toHaveBeenCalled();
    expect(searchMenuSpy).toHaveBeenCalled();
    expect(clearCanvasSpy).toHaveBeenCalled();
    expect(toggleThemeSpy).toHaveBeenCalled();
    expect(screen.getByTestId("main-menu")).toBeTruthy();
  });
});
