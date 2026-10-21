import type { Metadata } from "next";
import Link from "next/link";
import { Cursor } from "@/components/cursor";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { listDocuments } from "@/lib/documents";
import { requireUser } from "@/lib/session";
import { DocumentList } from "../_components/document-list";
import { LogOut } from "../_components/log-out";

export const instant = false;
export const metadata: Metadata = { title: "Your documents" };

export default async function Dashboard() {
  const user = await requireUser("/app");
  const documents = await listDocuments();
  const count = documents.length;
  return (
    <>
      <header className="wrap flex h-20 shrink-0 items-center gap-6">
        <Wordmark href="/app" />
        <LogOut />
      </header>
      <main className="wrap flex flex-1 flex-col pt-[clamp(24px,6vh,72px)] pb-[clamp(64px,14vh,160px)]">
        <DocumentList
          documents={documents}
          // Rendered once per request: the time is the request's.
          // eslint-disable-next-line react-hooks/purity
          now={Date.now()}
          empty={<Empty name={user.name} />}
        />
        {count > 0 && (
          <div className="order-first mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="text-section font-extrabold tracking-[-0.03em]">
                Your documents
              </h1>
              <p className="mt-2 text-[1.15rem] text-muted-foreground">
                {count === 1 ? "One document." : `${count} documents.`} None of
                them will finish itself.
              </p>
            </div>
            <Link href="/write" className={buttonVariants({ size: "xl" })}>
              Start typing
            </Link>
          </div>
        )}
      </main>
    </>
  );
}

function Empty({ name }: { name: string }) {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <p className="mb-3 font-semibold text-muted-foreground">Hi, {name}.</p>
      <h1 className="mb-4 max-w-[16ch] text-title font-extrabold tracking-[-0.04em]">
        Nothing here yet.
        <Cursor />
      </h1>
      <p className="mb-8 max-w-[40ch] text-[1.3rem] text-muted-foreground">
        Not a single document. The cursor is not judging. (It is.)
      </p>
      <div>
        <Link href="/write" className={buttonVariants({ size: "2xl" })}>
          Start typing
        </Link>
      </div>
    </div>
  );
}
