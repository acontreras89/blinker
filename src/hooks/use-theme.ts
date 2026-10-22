import { useCallback, useEffect } from "react";
import { useStored } from "./use-stored";

import { THEME_KEY, themes, type Theme } from "@/lib/theme";

export { themes, type Theme };

/** The reader's theme, per device; "system" follows the OS. */
export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setStored] = useStored<Theme>(THEME_KEY, "system", themes);
  // Also from other tabs: the stored value is the truth.
  useEffect(() => apply(theme), [theme]);
  const set = useCallback(
    (next: Theme) => {
      apply(next);
      setStored(next);
    },
    [setStored],
  );
  return [theme, set];
}

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
}
