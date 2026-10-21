import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { DocumentEditor } from "../_components/document-editor";

export const instant = false;
export const metadata: Metadata = { title: "New document" };

// A blank page (or the landing draft); the document exists from its first save.
export default async function Write() {
  await requireUser("/write");
  return <DocumentEditor />;
}
