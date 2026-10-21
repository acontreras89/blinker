"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type DeleteDialogProps = {
  open: boolean;
  /** The document's title; kept while the dialog closes. */
  title: string;
  onCancel: () => void;
  /** Deletes; the dialog stays up, busy, until it resolves. */
  onConfirm: () => Promise<void>;
};

/** Asks before deleting for good, naming the document. */
export function DeleteDialog({
  open,
  title,
  onCancel,
  onConfirm,
}: DeleteDialogProps) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <AlertDialog
      open={open}
      onOpenChange={(open) => {
        if (!open && !busy) onCancel();
      }}
      onOpenChangeComplete={(open) => {
        if (!open) setFailed(false);
      }}
    >
      <AlertDialogContent className="gap-5 p-6 sm:max-w-md">
        <AlertDialogHeader className="gap-2">
          <AlertDialogTitle className="text-xl font-bold tracking-[-0.01em] break-words [overflow-wrap:anywhere]">
            Delete &ldquo;{title}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Gone for good. There is no undo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {failed && (
          <p role="alert" className="text-[0.95rem] text-destructive">
            Not deleted. The server blinked first. Try again.
          </p>
        )}
        <AlertDialogFooter className="-mx-6 -mb-6 bg-muted/60 px-6 py-4">
          <AlertDialogCancel size="lg" className="px-4">
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            size="lg"
            className="px-4"
            aria-disabled={busy || undefined}
            onClick={async () => {
              if (busy) return;
              setBusy(true);
              setFailed(false);
              try {
                await onConfirm();
              } catch {
                setFailed(true);
              }
              setBusy(false);
            }}
          >
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
