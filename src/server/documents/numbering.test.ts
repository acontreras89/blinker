import { describe, expect, it } from "vitest";
import { nextUntitled } from "./numbering";

describe("nextUntitled", () => {
  it.each([
    [[], "Untitled"],
    [["Untitled"], "Untitled (1)"],
    [["Untitled", "Untitled (1)"], "Untitled (2)"],
    // The lowest free number is reused, not max + 1.
    [["Untitled", "Untitled (2)"], "Untitled (1)"],
    [["Untitled (1)"], "Untitled"],
    [["Untitled", "Untitled"], "Untitled (1)"],
    [["Notes", "untitled", "Untitled (x)", "Untitled  (1)"], "Untitled"],
  ])("%j → %s", (titles, expected) => {
    expect(nextUntitled(titles)).toBe(expected);
  });
});
