import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it.each(["/app", "/write", "/app/docs/1?x=1"])("keeps %s", (next) => {
    expect(safeNext(next)).toBe(next);
  });

  it.each([
    null,
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/a-page-that-does-not-exist",
    "/application",
  ])("falls back to /app for %s", (next) => {
    expect(safeNext(next)).toBe("/app");
  });
});
