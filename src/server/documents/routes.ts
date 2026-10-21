import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import { requireUser, type User } from "../auth/middleware";
import { getAccess } from "../billing/access";
import { CONTENT_MAX_BYTES, content, title, type Content } from "./rules";
import {
  createDocument,
  deleteDocument,
  getDocument,
  countDocuments,
  listDocuments,
  renameDocument,
  saveContent,
} from "./use-cases";

const missing = { error: "not_found" } as const;

// Content is the whole document on every save (ADR-0008): ≤ 1 MB, else 413.
const limit = bodyLimit({
  maxSize: CONTENT_MAX_BYTES,
  onError: (c) => c.json({ error: "too_large" as const }, 413),
});

const dates = (d: { createdAt: Date; updatedAt: Date }) => ({
  createdAt: d.createdAt.toISOString(),
  updatedAt: d.updatedAt.toISOString(),
});

// Writing needs access (docs/plans/E6-billing.md); reading and deleting don't.
// A trial also caps how many documents exist at once. Everything after this
// runs synchronously on SQLite, so the count can't race the insert.
const noAccess = { error: "no_access" } as const;
const trialLimit = { error: "trial_limit" } as const;
const canWrite = (creating: boolean) =>
  createMiddleware<{ Variables: { user: User } }>(async (c, next) => {
    const userId = c.var.user.id;
    const access = getAccess(userId);
    if (!access) return c.json(noAccess, 403);
    const { documentLimit } = access;
    if (creating && documentLimit !== null)
      if (countDocuments(userId) >= documentLimit)
        return c.json(trialLimit, 403);
    await next();
  });

// A logged-in user's own documents.
export const documentRoutes = new Hono<{ Variables: { user: User } }>()
  .use(requireUser)
  .get("/", (c) => {
    const documents = listDocuments(c.var.user.id).map((d) => ({
      ...d,
      ...dates(d),
    }));
    return c.json({ documents });
  })
  .post(
    "/",
    canWrite(true),
    limit,
    zValidator("json", z.object({ content })),
    (c) => {
      const d = createDocument(c.var.user.id, c.req.valid("json").content);
      const { id, title, revision } = d;
      return c.json({ document: { id, title, revision, ...dates(d) } }, 201);
    },
  )
  .get("/:id", (c) => {
    const d = getDocument(c.var.user.id, c.req.param("id"));
    if (!d) return c.json(missing, 404);
    return c.json({
      document: {
        id: d.id,
        title: d.title,
        content: d.content as Content,
        revision: d.revision,
        ...dates(d),
      },
    });
  })
  .put(
    "/:id/content",
    canWrite(false),
    limit,
    zValidator(
      "json",
      z.object({
        content,
        revision: z.int().positive(),
        mode: z.enum(["manual", "auto"]),
      }),
    ),
    (c) => {
      const { content, revision, mode } = c.req.valid("json");
      const result = saveContent(
        c.var.user.id,
        c.req.param("id"),
        content,
        revision,
        mode,
      );
      if (result.status === "missing") return c.json(missing, 404);
      if (result.status === "conflict")
        return c.json(
          { error: "conflict" as const, revision: result.revision },
          409,
        );
      return c.json({
        revision: result.revision,
        updatedAt: result.updatedAt.toISOString(),
        overwrote: result.overwrote,
      });
    },
  )
  .patch(
    "/:id",
    canWrite(false),
    zValidator("json", z.object({ title })),
    (c) => {
      const d = renameDocument(
        c.var.user.id,
        c.req.param("id"),
        c.req.valid("json").title,
      );
      if (!d) return c.json(missing, 404);
      return c.json({ title: d.title, updatedAt: d.updatedAt.toISOString() });
    },
  )
  .delete("/:id", (c) => {
    if (!deleteDocument(c.var.user.id, c.req.param("id")))
      return c.json(missing, 404);
    return c.body(null, 204);
  });
