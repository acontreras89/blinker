import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { requireUser, type User } from "./auth/middleware";
import { title } from "./documents/rules";
import { createDocument } from "./documents/use-cases";

// Test-only setup for e2e `Given`s: state the UI can't make, like backdated
// documents. Off unless the e2e server sets E2E_SEED=on; every route then acts
// as the cookie's user only.
export const e2eRoutes = new Hono<{ Variables: { user: User } }>()
  .use(async (c, next) => {
    if (process.env.E2E_SEED !== "on") return c.notFound();
    await next();
  })
  .use(requireUser)
  .post(
    "/documents",
    zValidator(
      "json",
      z.object({
        title: title.min(1).optional(),
        text: z.string().optional(),
        createdAt: z.coerce.date().optional(),
        updatedAt: z.coerce.date().optional(),
      }),
    ),
    (c) => {
      const { text, ...seed } = c.req.valid("json");
      const paragraph = text
        ? { type: "paragraph", content: [{ type: "text", text }] }
        : { type: "paragraph" };
      const d = createDocument(
        c.var.user.id,
        { type: "doc", content: [paragraph] },
        seed,
      );
      return c.json({ id: d.id, title: d.title }, 201);
    },
  );
