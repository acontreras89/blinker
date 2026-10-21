import "server-only";
import { headers } from "next/headers";
import type { Content } from "@/server/documents/rules";
import { api } from "./api";

// The user's documents, for Server Components and Server Actions. Each call
// forwards the request's cookie; the backend checks it and the ownership.
const auth = async () => ({
  headers: { cookie: (await headers()).get("cookie") ?? "" },
});

export async function listDocuments() {
  const res = await api.documents.$get(undefined, await auth());
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return (await res.json()).documents;
}

/** Null for a missing or foreign id: both are the 404 page. */
export async function getDocument(id: string) {
  const res = await api.documents[":id"].$get({ param: { id } }, await auth());
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Get failed: ${res.status}`);
  return (await res.json()).document;
}

/** Null when the content is over the size limit. */
export async function createDocument(content: Content) {
  const res = await api.documents.$post({ json: { content } }, await auth());
  // The body limit answers before the route, so the typed client misses it.
  if ((res.status as number) === 413) return null;
  if (res.status !== 201) throw new Error(`Create failed: ${res.status}`);
  return (await res.json()).document;
}

export type SaveOutcome =
  | { status: "saved"; revision: number; updatedAt: string; overwrote: boolean }
  | { status: "conflict"; revision: number }
  | { status: "missing" | "too_large" | "failed" };

/** Never throws: every outcome is a save state the editor shows. */
export async function saveContent(
  id: string,
  content: Content,
  revision: number,
  mode: "manual" | "auto",
): Promise<SaveOutcome> {
  try {
    const res = await api.documents[":id"].content.$put(
      { param: { id }, json: { content, revision, mode } },
      await auth(),
    );
    if (res.status === 200) return { status: "saved", ...(await res.json()) };
    if (res.status === 409)
      return { status: "conflict", revision: (await res.json()).revision };
    if (res.status === 404) return { status: "missing" };
    if (res.status === 413) return { status: "too_large" };
    return { status: "failed" };
  } catch {
    return { status: "failed" };
  }
}

/** Null for a missing document. The title is trimmed; empty keeps the old one. */
export async function renameDocument(id: string, title: string) {
  const res = await api.documents[":id"].$patch(
    { param: { id }, json: { title } },
    await auth(),
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Rename failed: ${res.status}`);
  return await res.json();
}

/** False if it was already gone. */
export async function deleteDocument(id: string) {
  const res = await api.documents[":id"].$delete(
    { param: { id } },
    await auth(),
  );
  if (res.status === 404) return false;
  if (res.status !== 204) throw new Error("Delete failed");
  return true;
}
