"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * A tooltip for a control: its name and, if any, its shortcut. Never a
 * `title`: those are slow, unstyled and absent on touch.
 */
export function Hint({
  label,
  keys,
  side = "bottom",
  children,
}: {
  label: React.ReactNode;
  keys?: string;
  side?: "top" | "bottom";
  children: React.ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side={side}>
        {label}
        {keys && (
          <kbd className="rounded-sm bg-background/15 px-1 font-semibold">
            {keys}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
