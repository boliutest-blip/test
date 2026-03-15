# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

- This repository is currently a **fresh Tauri 2 + React + TypeScript + Vite template**.
- The product direction is documented in [specs/0001-spec.md](specs/0001-spec.md): a simple local desktop app for browsing and editing `.excalidraw` files.
- The current app implementation is still the default scaffold:
  - frontend shows the default Tauri/React greeting UI in [src/App.tsx](src/App.tsx)
  - backend exposes a single sample `greet` Tauri command in [src-tauri/src/lib.rs](src-tauri/src/lib.rs)

## Common commands

### Install dependencies
```bash
npm install
```

### Frontend-only development
```bash
npm run dev
```
- Runs the Vite dev server.
- Vite is configured to use port `1420` in [vite.config.ts](vite.config.ts).

### Run the desktop app in development
```bash
npm run tauri dev
```
- This is the main development command for the desktop app.
- Tauri starts the Rust backend and uses `npm run dev` as `beforeDevCommand` from [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json).

### Build the frontend bundle only
```bash
npm run build
```
- Runs `tsc && vite build`.
- Produces the web assets consumed by Tauri.

### Preview the frontend bundle
```bash
npm run preview
```

### Build the desktop app
```bash
npm run tauri build
```
- Tauri runs `npm run build` first via `beforeBuildCommand` in [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json).

### Rust-only checks
```bash
cargo check --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml
```
- Useful when changing only the Rust/Tauri side.

## Testing and linting status

- There is currently **no test framework configured** for the frontend.
- There is currently **no lint script configured** in [package.json](package.json).
- There is currently **no single-test command** available because no JS/TS test runner is set up yet.
- For frontend validation, the main available check today is:
```bash
npm run build
```
- For Rust-side validation, use:
```bash
cargo check --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml
```

## High-level architecture

### Desktop shell
- The desktop container is Tauri 2.
- Tauri configuration lives in [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json).
- The main desktop window is currently configured with title `excaliapp` and size `800x600`.
- Capabilities are defined in [src-tauri/capabilities/default.json](src-tauri/capabilities/default.json). Right now only `core:default` and `opener:default` are enabled.

### Frontend
- The frontend is a Vite React TypeScript app under [src/](src/).
- Entry point: [src/main.tsx](src/main.tsx)
- Top-level component: [src/App.tsx](src/App.tsx)
- Styling is currently in [src/App.css](src/App.css)
- The frontend currently calls Tauri commands via `invoke` from `@tauri-apps/api/core`.

### Rust / Tauri backend
- Rust entry point for the executable is [src-tauri/src/main.rs](src-tauri/src/main.rs).
- App construction happens in [src-tauri/src/lib.rs](src-tauri/src/lib.rs).
- Tauri commands are registered in the builder’s `invoke_handler` in [src-tauri/src/lib.rs](src-tauri/src/lib.rs).
- At the moment there is only one sample command, `greet`, which exists as scaffold code and should not be treated as product logic.

## Intended product architecture

The target architecture is described in [specs/0001-spec.md](specs/0001-spec.md). The important big-picture split is:

1. **Tauri / Rust side**
   - directory picker
   - local filesystem access
   - config persistence for last opened directory
   - file read/write commands for `.excalidraw` documents

2. **React side**
   - app shell layout
   - left sidebar file list
   - active file state
   - save/load/error UI state
   - keyboard shortcut handling

3. **Excalidraw integration**
   - the editor should be embedded in the main content area
   - editor changes should mark the current document dirty
   - save operations should serialize the current editor state back to the original `.excalidraw` file

## Implementation notes for future work

- This repo has not implemented the PRD yet; most product work will be net-new code replacing the scaffold.
- When adding new desktop capabilities, update both the Rust side and Tauri capability/config files if required.
- Prefer treating the Rust side as a thin boundary around OS/file access, and keep UI state orchestration in React.
- The most important behavior to preserve from the spec is save correctness:
  - manual save with `Ctrl/Cmd + S`
  - autosave for dirty documents
  - save-before-switch when moving between files
  - no accidental writes to the wrong file during rapid switching

## Files worth reading first

- [specs/0001-spec.md](specs/0001-spec.md) — product requirements, technical architecture, and development plan
- [package.json](package.json) — available npm scripts and frontend dependencies
- [vite.config.ts](vite.config.ts) — Tauri-oriented Vite dev server setup
- [src/App.tsx](src/App.tsx) — current frontend scaffold entry component
- [src-tauri/src/lib.rs](src-tauri/src/lib.rs) — current Tauri builder and command registration
- [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json) — desktop build/dev configuration
