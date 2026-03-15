export function isSaveShortcut(event: KeyboardEvent): boolean {
  return (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";
}

export function getSaveShortcutLabel(platform: string): string {
  return platform.includes("mac") ? "⌘S" : "Ctrl+S";
}
