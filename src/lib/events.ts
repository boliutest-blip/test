import { listen } from "@tauri-apps/api/event";

export const MENU_EVENT_OPEN_DIRECTORY = "menu://open-directory";
export const MENU_EVENT_SAVE = "menu://save";

export async function listenToMenuEvent(
  eventName: string,
  callback: () => void,
): Promise<() => void> {
  return listen(eventName, () => {
    callback();
  });
}
