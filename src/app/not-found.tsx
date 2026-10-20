import type { Metadata } from "next";
import Link from "next/link";
import { StatusPage } from "@/components/status-page";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <StatusPage
      code={404}
      title="Blank page."
      actions={
        <>
          <Link href="/signup" className={buttonVariants({ size: "2xl" })}>
            Start typing
          </Link>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground"
          >
            Back to the landing
          </Link>
        </>
      }
    >
      Nothing lives at this address. If you&apos;re going to stare at a blank
      page, make it one of yours.
    </StatusPage>
  );
}
