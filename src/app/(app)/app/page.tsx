import type { Metadata } from "next";
import { getBilling, writing } from "@/lib/billing";
import { listDocuments } from "@/lib/documents";
import { requireUser } from "@/lib/session";
import { AppHeader } from "../_components/app-header";
import { Notice } from "../_components/notice";
import { DocumentList } from "../_components/document-list";
import { ForgetQuery } from "../_components/forget-query";
import { StartTyping } from "../_components/start-typing";
import {
  ManageBillingButton,
  SubscribeButton,
} from "../_components/subscribe-button";
import { billingCopy } from "../billing/copy";

export const instant = false;
export const metadata: Metadata = { title: "Your documents" };

export default async function Dashboard({ searchParams }: PageProps<"/app">) {
  await requireUser("/app");
  const [documents, { access, had }, { checkout }] = await Promise.all([
    listDocuments(),
    getBilling(),
    searchParams,
  ]);
  const count = documents.length;
  const mode = writing(access, count);
  return (
    <>
      <AppHeader />
      <main className="wrap flex flex-1 flex-col pt-[clamp(24px,6vh,72px)] pb-[clamp(64px,14vh,160px)]">
        <div className="order-first mb-10 flex flex-col gap-3 empty:hidden">
          {/* The return page sends them here when the Checkout isn't theirs. */}
          {checkout === "invalid" && (
            <Notice tone="destructive" role="alert">
              {billingCopy.notTheirs}
              <ForgetQuery />
            </Notice>
          )}
          {!access && (
            <Notice
              // "Start typing" stays the primary CTA; this one is quieter.
              action={<SubscribeButton had={had} variant="outline" size="lg" />}
            >
              {billingCopy.readOnly[had ? "lapsed" : "never"]}
            </Notice>
          )}
          {access?.status === "past_due" && (
            <Notice
              tone="warning"
              action={<ManageBillingButton variant="outline" size="lg" />}
            >
              {billingCopy.pastDue}
            </Notice>
          )}
        </div>
        <DocumentList
          documents={documents}
          // Rendered once per request: the time is the request's.
          // eslint-disable-next-line react-hooks/purity
          now={Date.now()}
          canRename={!!access}
          empty={null}
        />
        {/* Empty, only the line under the title changes: not an error page. */}
        <div className="order-first mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-section font-extrabold tracking-[-0.03em]">
              Your documents
            </h1>
            <p className="mt-2 text-[1.15rem] text-muted-foreground">
              {count === 0 ? (
                <>
                  <span>Nothing here yet.</span> The cursor is not judging. (It
                  is.)
                </>
              ) : count === 1 ? (
                "One document. It won't finish itself."
              ) : (
                `${count} documents. None of them will finish itself.`
              )}
            </p>
          </div>
          <StartTyping mode={mode} size="xl" />
        </div>
      </main>
    </>
  );
}
