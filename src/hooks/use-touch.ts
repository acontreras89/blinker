import { useSyncExternalStore } from "react";

const media = (query: string) => ({
  subscribe(onChange: () => void) {
    const list = matchMedia(query);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => matchMedia(query).matches,
});

const touch = media("(pointer: coarse)");

/** Touch-first device: no hover, no keyboard shortcuts to lean on. */
export function useTouch(): boolean {
  return useSyncExternalStore(touch.subscribe, touch.get, () => false);
}
