"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import { themes, useTheme, type Theme } from "@/hooks/use-theme";

const names: Record<Theme, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};
const icons = { system: MonitorIcon, light: SunIcon, dark: MoonIcon };

/** A header button for the theme: its icon is the current one, a click the next. */
export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const Icon = icons[theme];
  const label = `Theme: ${names[theme]}`;
  return (
    <Hint label={label}>
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label={label}
        onClick={() =>
          setTheme(themes[(themes.indexOf(theme) + 1) % themes.length])
        }
        className="shrink-0 text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-[18px]"
      >
        <Icon />
      </Button>
    </Hint>
  );
}
