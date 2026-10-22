"use client";

import { cn } from "cn";
import {
  ArrowLeftIcon,
  EllipsisIcon,
  PinIcon,
  PinOffIcon,
  TextCursorIcon,
  TypeIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Hint } from "@/components/hint";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { shortcutLabel, useMac } from "@/hooks/use-mac";
import { TitleField } from "./title-field";
import type { Phase, Problem } from "./use-saver";

export const headerModes = ["on-request", "until-typing", "always"] as const;
export type HeaderMode = (typeof headerModes)[number];
const modeNames: Record<HeaderMode, string> = {
  "on-request": "On request",
  "until-typing": "Until typing",
  always: "Always",
};
const modeIcons = {
  "on-request": PinOffIcon,
  "until-typing": TextCursorIcon,
  always: PinIcon,
};

type EditorHeaderProps = {
  /** The stored document; none until a new one's first save. */
  doc: { id: string; title: string } | null;
  onRenamed: (title: string) => void;
  phase: Phase;
  problem: Problem | null;
  onSave: () => void;
  toolbar: boolean;
  onToolbar: () => void;
  mode: HeaderMode;
  onMode: (mode: HeaderMode) => void;
  onDelete: () => void;
  onBack: (event: React.MouseEvent) => void;
  /** A menu is open: the header stays put. */
  onMenu: (open: boolean) => void;
  /** Touch: header and toolbar are always there, nothing to toggle. */
  fixed: boolean;
  /** No subscription: nothing to save, rename or format. */
  readOnly: boolean;
};

/** Everything but the page: back, title, save, toolbar, header mode, delete. */
export function EditorHeader({
  doc,
  onRenamed,
  phase,
  problem,
  onSave,
  toolbar,
  onToolbar,
  mode,
  onMode,
  onDelete,
  onBack,
  onMenu,
  fixed,
  readOnly,
}: EditorHeaderProps) {
  const [renaming, setRenaming] = useState(false);
  const mac = useMac();

  return (
    <div className="flex h-14 items-center gap-2 px-[clamp(8px,2vw,20px)]">
      <Hint label="Documents">
        <Link
          href="/app"
          onClick={onBack}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeftIcon className="size-[18px]" />
          <span className="sr-only">Documents</span>
        </Link>
      </Hint>
      <span aria-hidden="true" className="h-5 w-px shrink-0 bg-border" />
      <div className="min-w-0 flex-1 text-[1rem] font-semibold">
        {!doc ? (
          <span className="block truncate px-2 text-muted-foreground">
            New document
          </span>
        ) : readOnly ? (
          <span className="block truncate px-2">{doc.title}</span>
        ) : renaming ? (
          <TitleField
            id={doc.id}
            title={doc.title}
            onDone={(title) => {
              setRenaming(false);
              onRenamed(title);
            }}
            className="max-w-md"
          />
        ) : (
          // As wide as the field it turns into: easy to hit.
          <Hint label="Rename">
            <button
              type="button"
              onClick={() => setRenaming(true)}
              className="block w-full max-w-md truncate rounded-md border border-transparent px-2 text-left hover:bg-muted"
            >
              {doc.title}
            </button>
          </Hint>
        )}
      </div>
      {!readOnly && (
        <>
          <SaveIndicator phase={phase} problem={problem} />
          <Hint label="Save" keys={shortcutLabel({ key: "S" }, mac)}>
            <Button
              variant="outline"
              size="lg"
              onClick={onSave}
              className="shrink-0 px-3.5 font-semibold"
            >
              Save
            </Button>
          </Hint>
        </>
      )}
      {!fixed && (
        <>
          <span
            aria-hidden="true"
            className="mx-1 h-5 w-px shrink-0 bg-border"
          />
          {!readOnly && (
            <IconButton
              label="Toolbar"
              aria-pressed={toolbar}
              onClick={onToolbar}
              className="aria-pressed:bg-muted aria-pressed:text-foreground"
            >
              <TypeIcon />
            </IconButton>
          )}
          <ModeToggle mode={mode} onMode={onMode} />
        </>
      )}
      <ThemeToggle />
      <DropdownMenu onOpenChange={onMenu}>
        <DropdownMenuTrigger render={<IconButton label="More options" />}>
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            variant="destructive"
            disabled={!doc}
            onClick={onDelete}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** The header mode, cycled: its icon is the current one, a click the next. */
function ModeToggle({
  mode,
  onMode,
}: {
  mode: HeaderMode;
  onMode: (mode: HeaderMode) => void;
}) {
  const Icon = modeIcons[mode];
  return (
    <IconButton
      label={`Show header: ${modeNames[mode]}`}
      onClick={() =>
        onMode(
          headerModes[(headerModes.indexOf(mode) + 1) % headerModes.length],
        )
      }
    >
      <Icon />
    </IconButton>
  );
}

function IconButton({
  label,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={label}
            className={cn(
              "shrink-0 text-muted-foreground hover:text-foreground aria-expanded:text-foreground [&_svg:not([class*='size-'])]:size-[18px]",
              className,
            )}
            {...props}
          />
        }
      />
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

const indicator: Record<Phase, string> = {
  idle: "",
  unsaved: "Unsaved",
  saving: "Saving",
  saved: "Saved",
};

/** The quiet, visual save state; the announced one lives outside the header. */
function SaveIndicator({
  phase,
  problem,
}: {
  phase: Phase;
  problem: Problem | null;
}) {
  const failed = problem && problem !== "overwrote";
  const label = failed && phase !== "saving" ? "Not saved" : indicator[phase];
  if (!label) return null;
  const tone = problem === "warned" || problem === "changedElsewhere";
  return (
    <span
      aria-hidden="true"
      data-state={failed ? (tone ? "warning" : "error") : phase}
      className={cn(
        "mr-1 hidden shrink-0 items-center gap-2 text-[0.9rem] text-muted-foreground sm:inline-flex",
        "before:size-[7px] before:rounded-full before:bg-current before:opacity-60",
        "data-[state=saved]:before:bg-success data-[state=saved]:before:opacity-100",
        "data-[state=saving]:before:animate-blink",
        "data-[state=warning]:text-warning data-[state=warning]:before:opacity-100",
        "data-[state=error]:text-destructive data-[state=error]:before:opacity-100",
      )}
    >
      {label}
    </span>
  );
}
