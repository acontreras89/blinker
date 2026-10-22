import type { Metadata } from "next";
import { getBilling, writing } from "@/lib/billing";
import { listDocuments } from "@/lib/documents";
import { requireUser } from "@/lib/session";
import { DocumentEditor } from "../_components/document-editor";
import { FreshOnReturn } from "../_components/fresh-on-return";

export const instant = false;
export const metadata: Metadata = { title: "New document" };

// A blank page (or the landing draft); the document exists from its first save.
// Without a subscription, or at the trial's cap, it reads only and shows the
// way back to writing.
export default async function Write() {
  await requireUser("/write");
  const [{ access, had }, documents] = await Promise.all([
    getBilling(),
    listDocuments(),
  ]);
  const mode = writing(access, documents.length);
  return (
    <FreshOnReturn>
      <DocumentEditor
        key={mode}
        readOnly={mode !== "write"}
        capped={mode === "capped"}
        had={had}
      />
    </FreshOnReturn>
  );
}
