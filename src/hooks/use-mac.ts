import { useSyncExternalStore } from "react";

// Apple keyboards get symbols; the rest spell the modifiers out. Prerendering
// assumes a Mac; the real platform follows on hydration.
const apple = {
  subscribe: () => () => {},
  get: () => /Mac|iPhone|iPad/.test(navigator.platform),
};

export function useMac(): boolean {
  return useSyncExternalStore(apple.subscribe, apple.get, () => true);
}

/** "⌘⇧S" on a Mac, "Ctrl+Shift+S" elsewhere. */
export function shortcutLabel(
  keys: { shift?: boolean; alt?: boolean; key: string },
  mac: boolean,
): string {
  const { shift, alt, key } = keys;
  if (mac) return `⌘${shift ? "⇧" : ""}${alt ? "⌥" : ""}${key}`;
  return ["Ctrl", shift && "Shift", alt && "Alt", key]
    .filter(Boolean)
    .join("+");
}
