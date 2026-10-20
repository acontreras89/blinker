"use client";

import { ServerError } from "@/components/server-error";

export default function Error(props: { error: unknown; retry: () => void }) {
  return (
    <>
      <title>Something broke · Blinker</title>
      <ServerError {...props} />
    </>
  );
}
