"use client";

import { EllipsisIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
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
import { useClock } from "@/hooks/use-clock";
import { exactDate, timeAgo } from "@/lib/dates";
import { remove } from "../actions";
import { DeleteDialog } from "./delete-dialog";
import { TitleField } from "./title-field";

export type Summary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type DocumentListProps = {
  documents: Summary[];
  /** The server's clock, so the first paint matches; the client's after. */
  now: number;
  /** Shown once the list is empty, deletions included. */
  empty: React.ReactNode;
};

/**
 * The user's documents, newest first as the server sends them. Standalone so
 * it can move into a sidebar. Renames and deletions show at once, then the
 * server's order replaces the list.
 */
export function DocumentList({ documents, now, empty }: DocumentListProps) {
  const router = useRouter();
  const clock = useClock(60_000);
  // Local edits hold only until the server sends a fresh list.
  const [local, setLocal] = useState({
    basis: documents,
    titles: {} as Record<string, string>,
    removed: [] as string[],
  });
  const edits = local.basis === documents ? local : null;
  const edit = (change: (l: typeof local) => Partial<typeof local>) =>
    setLocal((l) => {
      const current =
        l.basis === documents ? l : { ...l, titles: {}, removed: [] };
      return { ...current, ...change(current), basis: documents };
    });

  const [renaming, setRenaming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<{
    id: string;
    title: string;
    open: boolean;
  } | null>(null);

  const shown = documents
    .filter((d) => !edits?.removed.includes(d.id))
    .map((d) => ({ ...d, title: edits?.titles[d.id] ?? d.title }));

  return (
    <>
      {shown.length === 0 ? (
        empty
      ) : (
        <ul className="border-t sm:-mx-4">
          {shown.map((doc) => (
            <Row
              key={doc.id}
              doc={doc}
              now={clock.now || now}
              renaming={renaming === doc.id}
              onRename={() => setRenaming(doc.id)}
              onRenamed={(title) => {
                setRenaming(null);
                if (title === doc.title) return;
                edit((l) => ({ titles: { ...l.titles, [doc.id]: title } }));
                router.refresh();
              }}
              onDelete={() =>
                setDeleting({ id: doc.id, title: doc.title, open: true })
              }
            />
          ))}
        </ul>
      )}
      <DeleteDialog
        open={!!deleting?.open}
        title={deleting?.title ?? ""}
        onCancel={() => setDeleting((d) => d && { ...d, open: false })}
        onConfirm={async () => {
          if (!deleting) return;
          await remove(deleting.id);
          edit((l) => ({ removed: [...l.removed, deleting.id] }));
          setDeleting({ ...deleting, open: false });
          router.refresh();
        }}
      />
    </>
  );
}

type RowProps = {
  doc: Summary;
  now: number;
  renaming: boolean;
  onRename: () => void;
  onRenamed: (title: string) => void;
  onDelete: () => void;
};

function Row({ doc, now, renaming, onRename, onRenamed, onDelete }: RowProps) {
  // Renaming takes focus to the field: the closing menu must not take it back.
  const renameNext = useRef(false);
  return (
    <li className="group relative flex items-center gap-4 border-b py-5 has-[a:hover]:bg-muted/40 has-[a:focus-visible]:bg-muted/40 sm:px-4">
      <div className="min-w-0 flex-1">
        {renaming ? (
          <TitleField
            id={doc.id}
            title={doc.title}
            onDone={onRenamed}
            className="-mx-2 text-[1.35rem] font-bold tracking-[-0.02em]"
          />
        ) : (
          <Link
            href={`/write/${doc.id}`}
            className="block truncate text-[1.35rem] font-bold tracking-[-0.02em] outline-none after:absolute after:inset-0 focus-visible:underline focus-visible:decoration-primary focus-visible:decoration-2 focus-visible:underline-offset-4"
          >
            {doc.title}
          </Link>
        )}
        <p className="relative mt-1 flex gap-x-3 text-[0.95rem] text-muted-foreground max-sm:flex-col">
          <span>
            Updated <Moment iso={doc.updatedAt} now={now} />
          </span>
          <span aria-hidden="true" className="max-sm:hidden">
            ·
          </span>
          <span>
            Created <Moment iso={doc.createdAt} now={now} />
          </span>
        </p>
      </div>
      <DropdownMenu
        onOpenChange={(open) => {
          if (open) renameNext.current = false;
        }}
      >
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="More options"
              className="relative text-muted-foreground hover:text-foreground aria-expanded:text-foreground"
            />
          }
        >
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-40"
          finalFocus={() => !renameNext.current}
        >
          <DropdownMenuItem
            onClick={() => {
              renameNext.current = true;
              onRename();
            }}
          >
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

/** A relative date; focused or hovered, the exact one (its description). */
function Moment({ iso, now }: { iso: string; now: number }) {
  const id = useId();
  const date = new Date(iso);
  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <time
              dateTime={iso}
              tabIndex={0}
              aria-describedby={id}
              className="rounded-sm underline decoration-border decoration-dotted underline-offset-4 hover:text-foreground"
            />
          }
        >
          {timeAgo(date, now)}
        </TooltipTrigger>
        <TooltipContent suppressHydrationWarning>
          {exactDate(date)}
        </TooltipContent>
      </Tooltip>
      <span id={id} hidden suppressHydrationWarning>
        {exactDate(date)}
      </span>
    </>
  );
}
