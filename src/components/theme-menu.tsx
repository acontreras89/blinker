"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { themes, useTheme, type Theme } from "@/hooks/use-theme";

const names: Record<Theme, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};
const icons = { system: MonitorIcon, light: SunIcon, dark: MoonIcon };

/** The theme's options, for any menu (the editor's "More options" too). */
export function ThemeItems() {
  const [theme, setTheme] = useTheme();
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>Theme</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={theme}
        onValueChange={(value) => setTheme(value as Theme)}
      >
        {themes.map((t) => (
          <DropdownMenuRadioItem key={t} value={t} closeOnClick>
            {names[t]}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuGroup>
  );
}

/** A header button for the theme: its icon is the current choice. */
export function ThemeMenu() {
  const [theme] = useTheme();
  const Icon = icons[theme];
  return (
    <DropdownMenu>
      <Hint label="Theme">
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Theme"
              className="text-muted-foreground hover:text-foreground aria-expanded:text-foreground [&_svg:not([class*='size-'])]:size-[18px]"
            />
          }
        >
          <Icon />
        </DropdownMenuTrigger>
      </Hint>
      <DropdownMenuContent align="end" className="w-40">
        <ThemeItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
