import mainSource from "./main.tsx?raw";

describe("main entrypoint", () => {
  it("renders the app without React StrictMode", () => {
    expect(mainSource).not.toContain("StrictMode");
    expect(mainSource).toContain("render(<App />)");
  });
});
