"use client";

import Link from "next/link";
import { useEffect } from "react";
import { StatusPage } from "@/components/status-page";
import { Button } from "@/components/ui/button";

/** Shared by error.tsx and global-error.tsx. */
export function ServerError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => console.error(error), [error]);

  return (
    <StatusPage
      code={500}
      title="That's on us."
      actions={
        <>
          <Button size="2xl" onClick={() => retry()}>
            Try again
          </Button>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground"
          >
            Back to the landing
          </Link>
        </>
      }
    >
      Something broke on our side. Anything already saved is safe.
    </StatusPage>
  );
}
