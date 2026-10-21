import { z } from "zod";

// Shared by the title control and the backend: zod only, safe to import from
// client code.
export const TITLE_MAX = 100;
export const CONTENT_MAX_BYTES = 1024 * 1024;

/** Trimmed; empty means "keep the previous title", decided by the use case. */
export const title = z.string().trim().max(TITLE_MAX);

// ProseMirror JSON: the shape only; the editor's schema checks node names on
// load. Unknown keys are stripped.
type Mark = { type: string; attrs?: Record<string, unknown> };
export type Node = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: Node[];
  marks?: Mark[];
  text?: string;
};
const attrs = z.record(z.string(), z.unknown()).optional();
const mark = z.object({ type: z.string().min(1), attrs });
const node: z.ZodType<Node> = z.lazy(() =>
  z.object({
    type: z.string().min(1),
    attrs,
    content: z.array(node).optional(),
    marks: z.array(mark).optional(),
    text: z.string().optional(),
  }),
);
export const content = z.object({
  type: z.literal("doc"),
  content: z.array(node).optional(),
});
export type Content = z.infer<typeof content>;
