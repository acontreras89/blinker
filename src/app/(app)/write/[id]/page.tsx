import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBilling } from "@/lib/billing";
import { getDocument } from "@/lib/documents";
import { requireUser } from "@/lib/session";
import { DocumentEditor } from "../../_components/document-editor";
import { FreshOnReturn } from "../../_components/fresh-on-return";

export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/write/[id]">): Promise<Metadata> {
  const doc = await getDocument((await params).id);
  return { title: doc?.title ?? "Page not found" };
}

// Missing and foreign documents are the same 404 (docs/security-notes.md).
export default async function Document({ params }: PageProps<"/write/[id]">) {
  const { id } = await params;
  await requireUser(`/write/${id}`);
  const [doc, { access, had }] = await Promise.all([
    getDocument(id),
    getBilling(),
  ]);
  if (!doc) notFound();
  return (
    <FreshOnReturn>
      <DocumentEditor
        // Paying again makes it writable: a new editor, editable from the start.
        key={`${doc.id}:${!!access}`}
        readOnly={!access}
        had={had}
        stored={{
          id: doc.id,
          title: doc.title,
          content: doc.content,
          revision: doc.revision,
        }}
      />
    </FreshOnReturn>
  );
}
