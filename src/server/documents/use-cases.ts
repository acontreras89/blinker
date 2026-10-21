import { and, desc, eq, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { db } from "../db";
import { documents } from "../db/schema";
import { nextUntitled } from "./numbering";
import type { Content } from "./rules";

// Every query is scoped by owner: another user's id reads like a missing one.
const owned = (userId: string, id: string) =>
  and(eq(documents.userId, userId), eq(documents.id, id));

// 8 base62 chars (ADR-0008). Not secrets; ownership is checked on every call.
const newId = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  8,
);

const summary = {
  id: documents.id,
  title: documents.title,
  createdAt: documents.createdAt,
  updatedAt: documents.updatedAt,
};

export function listDocuments(userId: string) {
  return db
    .select(summary)
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.updatedAt), desc(sql`rowid`))
    .all();
}

export function getDocument(userId: string, id: string) {
  return db.select().from(documents).where(owned(userId, id)).get() ?? null;
}

type Seed = { title?: string; createdAt?: Date; updatedAt?: Date };

/** A new document with the next free `Untitled` title, unless one is given. */
export function createDocument(
  userId: string,
  content: Content,
  seed: Seed = {},
) {
  return db.transaction((tx) => {
    const title =
      seed.title ??
      nextUntitled(
        tx
          .select({ title: documents.title })
          .from(documents)
          .where(eq(documents.userId, userId))
          .all()
          .map((d) => d.title),
      );
    for (let attempt = 0; ; attempt++) {
      try {
        return tx
          .insert(documents)
          .values({ id: newId(), userId, title, content, ...seed })
          .returning()
          .get();
      } catch (error) {
        if (attempt < 3 && isPrimaryKeyClash(error)) continue;
        throw error;
      }
    }
  });
}

const isPrimaryKeyClash = (error: unknown) =>
  (error as { code?: string }).code === "SQLITE_CONSTRAINT_PRIMARYKEY";

export type SaveMode = "manual" | "auto";
export type SaveResult =
  | { status: "saved"; revision: number; updatedAt: Date; overwrote: boolean }
  | { status: "conflict"; revision: number }
  | { status: "missing" };

/**
 * Saves the whole content, based on `revision` (ADR-0008). A manual save always
 * writes and reports whether it replaced a newer version; an autosave from a
 * stale base is refused.
 */
export function saveContent(
  userId: string,
  id: string,
  content: Content,
  revision: number,
  mode: SaveMode,
): SaveResult {
  return db.transaction((tx) => {
    const current = tx
      .select({ revision: documents.revision })
      .from(documents)
      .where(owned(userId, id))
      .get();
    if (!current) return { status: "missing" };
    const stale = current.revision !== revision;
    if (stale && mode === "auto")
      return { status: "conflict", revision: current.revision };
    const saved = tx
      .update(documents)
      .set({
        content,
        revision: current.revision + 1,
        updatedAt: new Date(),
      })
      .where(owned(userId, id))
      .returning({
        revision: documents.revision,
        updatedAt: documents.updatedAt,
      })
      .get()!;
    return { status: "saved", ...saved, overwrote: stale };
  });
}

/**
 * Renames and bumps `updatedAt`; the title arrives trimmed. Empty keeps the
 * previous title untouched. Duplicates are allowed: identity is the id.
 */
export function renameDocument(userId: string, id: string, title: string) {
  if (!title)
    return (
      db
        .select({ title: documents.title, updatedAt: documents.updatedAt })
        .from(documents)
        .where(owned(userId, id))
        .get() ?? null
    );
  return (
    db
      .update(documents)
      .set({ title, updatedAt: new Date() })
      .where(owned(userId, id))
      .returning({ title: documents.title, updatedAt: documents.updatedAt })
      .get() ?? null
  );
}

export function deleteDocument(userId: string, id: string) {
  return db.delete(documents).where(owned(userId, id)).run().changes > 0;
}
