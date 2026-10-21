"use server";

import {
  createDocument,
  deleteDocument,
  getDocument,
  renameDocument,
  saveContent,
  type Refused,
  type SaveOutcome,
} from "@/lib/documents";
import { title as titleRule, type Content } from "@/server/documents/rules";

// The editor's and the dashboard's writes. Each one goes through the backend,
// which re-checks the session, ownership and every rule mirrored in the UI.

export type CreateOutcome =
  | { status: "saved"; id: string; title: string; revision: number }
  | { status: "too_large" | "failed" | Refused };

export async function create(content: Content): Promise<CreateOutcome> {
  try {
    const document = await createDocument(content);
    if (typeof document === "string") return { status: document };
    const { id, title, revision } = document;
    return { status: "saved", id, title, revision };
  } catch {
    return { status: "failed" };
  }
}

export async function save(
  id: string,
  content: Content,
  revision: number,
  mode: "manual" | "auto",
): Promise<SaveOutcome> {
  return saveContent(id, content, revision, mode);
}

export type RenameOutcome =
  | { status: "renamed"; title: string }
  | { status: "too_long" | "missing" | Refused };

export async function rename(
  id: string,
  title: string,
): Promise<RenameOutcome> {
  if (!titleRule.safeParse(title).success) return { status: "too_long" };
  const renamed = await renameDocument(id, title);
  if (!renamed) return { status: "missing" };
  if (typeof renamed === "string") return { status: renamed };
  return { status: "renamed", title: renamed.title };
}

export async function remove(id: string): Promise<void> {
  await deleteDocument(id);
}

/** The stored revision, to tell a tab it fell behind; null once deleted. */
export async function revisionOf(id: string): Promise<number | null> {
  return (await getDocument(id))?.revision ?? null;
}
