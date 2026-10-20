"use client";

import { ServerError } from "@/components/server-error";
import { fontClass } from "./fonts";
import "./globals.css";

// Replaces the root layout when it fails, so it brings its own document.
export default function GlobalError(props: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <html lang="en" className={fontClass}>
      <body className="flex min-h-full flex-col text-lg leading-[1.55]">
        <title>Something broke · Blinker</title>
        <ServerError {...props} />
      </body>
    </html>
  );
}
