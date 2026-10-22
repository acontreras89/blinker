"use client";

import { Toolbar } from "@base-ui/react/toolbar";
import { useEditorState, type Editor } from "@tiptap/react";
import { cn } from "cn";
import {
  BoldIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PinIcon,
  PinOffIcon,
  QuoteIcon,
  Redo2Icon,
  SquareCodeIcon,
  StrikethroughIcon,
  Undo2Icon,
  type LucideIcon,
} from "lucide-react";
import { Fragment, useEffect, useId, useRef, useState } from "react";
import { Hint } from "@/components/hint";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { shortcutLabel, useMac } from "@/hooks/use-mac";

type Chain = ReturnType<Editor["chain"]>;
type Tool = {
  name: string;
  icon: LucideIcon;
  /** Shortcut keys after the modifier(s), or the Markdown that makes it. */
  keys?: { shift?: boolean; alt?: boolean; key: string };
  markdown?: string;
  run: (chain: Chain, editor: Editor) => Chain | void;
  /** Whether the format applies at the selection, for `aria-pressed`. */
  active?: (editor: Editor) => boolean;
};

// Tiptap's default shortcuts (plus ⌘K); every format has one, or a Markdown rule.
const groups: Tool[][] = [
  [
    {
      name: "Undo",
      icon: Undo2Icon,
      keys: { key: "Z" },
      run: (c) => c.undo(),
    },
    {
      name: "Redo",
      icon: Redo2Icon,
      keys: { shift: true, key: "Z" },
      run: (c) => c.redo(),
    },
  ],
  ([1, 2, 3] as const).map((level) => ({
    name: `Heading ${level}`,
    icon: [Heading1Icon, Heading2Icon, Heading3Icon][level - 1],
    keys: { alt: true, key: String(level) },
    run: (c) => c.toggleHeading({ level }),
    active: (e) => e.isActive("heading", { level }),
  })),
  [
    {
      name: "Bold",
      icon: BoldIcon,
      keys: { key: "B" },
      run: (c) => c.toggleBold(),
      active: (e) => e.isActive("bold"),
    },
    {
      name: "Italic",
      icon: ItalicIcon,
      keys: { key: "I" },
      run: (c) => c.toggleItalic(),
      active: (e) => e.isActive("italic"),
    },
    {
      name: "Strikethrough",
      icon: StrikethroughIcon,
      keys: { shift: true, key: "S" },
      run: (c) => c.toggleStrike(),
      active: (e) => e.isActive("strike"),
    },
    {
      name: "Inline code",
      icon: CodeIcon,
      keys: { key: "E" },
      run: (c) => c.toggleCode(),
      active: (e) => e.isActive("code"),
    },
    {
      name: "Link",
      icon: LinkIcon,
      keys: { key: "K" },
      run: () => {},
      active: (e) => e.isActive("link"),
    },
  ],
  [
    {
      name: "Bulleted list",
      icon: ListIcon,
      keys: { shift: true, key: "8" },
      run: (c) => c.toggleBulletList(),
      active: (e) => e.isActive("bulletList"),
    },
    {
      name: "Numbered list",
      icon: ListOrderedIcon,
      keys: { shift: true, key: "7" },
      run: (c) => c.toggleOrderedList(),
      active: (e) => e.isActive("orderedList"),
    },
    {
      name: "Quote",
      icon: QuoteIcon,
      keys: { shift: true, key: "B" },
      run: (c) => c.toggleBlockquote(),
      active: (e) => e.isActive("blockquote"),
    },
    {
      name: "Code block",
      icon: SquareCodeIcon,
      keys: { alt: true, key: "C" },
      run: (c) => c.toggleCodeBlock(),
      active: (e) => e.isActive("codeBlock"),
    },
    {
      name: "Horizontal rule",
      icon: MinusIcon,
      markdown: "---",
      run: (c) => c.setHorizontalRule(),
    },
  ],
];

const tools = groups.flat();

function shortcut(tool: Tool, mac: boolean) {
  return tool.keys ? shortcutLabel(tool.keys, mac) : (tool.markdown ?? "");
}

type FormattingToolbarProps = {
  editor: Editor;
  onLink: () => void;
  /** Touch devices: the toolbar is always there, nothing to pin. */
  pinnable: boolean;
  pinned: boolean;
  onPinnedChange: (pinned: boolean) => void;
  className?: string;
};

/** Every format, each teaching its shortcut in its tooltip and description. */
export function FormattingToolbar({
  editor,
  onLink,
  pinnable,
  pinned,
  onPinnedChange,
  className,
}: FormattingToolbarProps) {
  const id = useId();
  const mac = useMac();
  // On narrow screens it scrolls: a fade at the cut edge says there's more.
  const root = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const check = () =>
      setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    check();
    el.addEventListener("scroll", check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", check);
      observer.disconnect();
    };
  }, []);
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      active: tools.map((t) => t.active?.(editor) ?? false),
      undo: editor.can().undo(),
      redo: editor.can().redo(),
    }),
  });

  return (
    <Toolbar.Root
      ref={root}
      aria-label="Formatting"
      className={cn(
        "flex items-center gap-0.5 overflow-x-auto [scrollbar-width:none]",
        more && "mask-[linear-gradient(to_right,black_80%,transparent)]",
        className,
      )}
    >
      {groups.map((group, g) => (
        <Fragment key={g}>
          {g > 0 && (
            <Toolbar.Separator className="mx-1.5 h-5 w-px shrink-0 bg-border" />
          )}
          {group.map((tool) => {
            const i = tools.indexOf(tool);
            const hint = shortcut(tool, mac);
            const disabled =
              (tool.name === "Undo" && !state.undo) ||
              (tool.name === "Redo" && !state.redo);
            return (
              <Fragment key={tool.name}>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Toolbar.Button
                        aria-label={tool.name}
                        aria-describedby={`${id}-${i}`}
                        aria-pressed={tool.active ? state.active[i] : undefined}
                        aria-disabled={disabled || undefined}
                        // Keep the editor's selection: the click is not a focus move.
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          if (disabled) return;
                          if (tool.name === "Link") return onLink();
                          const chain = editor.chain().focus();
                          (tool.run(chain, editor) ?? chain).run();
                        }}
                        className={toolButton}
                      />
                    }
                  >
                    <tool.icon />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {tool.name}
                    <kbd className="rounded-sm bg-background/15 px-1 font-semibold">
                      {hint}
                    </kbd>
                  </TooltipContent>
                </Tooltip>
                <span id={`${id}-${i}`} hidden>
                  {hint}
                </span>
              </Fragment>
            );
          })}
        </Fragment>
      ))}
      {pinnable && (
        <Hint
          label={pinned ? "Unpin toolbar" : "Pin toolbar: keep it while typing"}
        >
          <Toolbar.Button
            aria-label={pinned ? "Unpin toolbar" : "Pin toolbar"}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPinnedChange(!pinned)}
            className={cn(toolButton, "ml-auto")}
          >
            {pinned ? <PinOffIcon /> : <PinIcon />}
          </Toolbar.Button>
        </Hint>
      )}
    </Toolbar.Root>
  );
}

const toolButton =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-disabled:cursor-default aria-disabled:opacity-40 aria-pressed:bg-muted aria-pressed:text-foreground [&_svg]:size-[18px]";
