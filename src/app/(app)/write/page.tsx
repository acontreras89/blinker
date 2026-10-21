import type { Metadata } from "next";
import { getBilling } from "@/lib/billing";
import { requireUser } from "@/lib/session";
import { DocumentEditor } from "../_components/document-editor";

export const instant = false;
export const metadata: Metadata = { title: "New document" };

// A blank page (or the landing draft); the document exists from its first save.
// Without a subscription it reads only and shows the way back to writing.
export default async function Write() {
  await requireUser("/write");
  const { access, had } = await getBilling();
  return <DocumentEditor readOnly={!access} had={had} />;
}
