import { describe, expect, it } from "vitest";
import { exactDate, timeAgo } from "./dates";

const now = new Date("2026-10-21T12:00:00").getTime();
const before = (seconds: number) => new Date(now - seconds * 1000);

describe("timeAgo", () => {
  it("says just now under a minute", () => {
    expect(timeAgo(before(59), now)).toBe("just now");
    expect(timeAgo(new Date(now + 5000), now)).toBe("just now");
  });

  it("rounds down to the largest whole unit", () => {
    expect(timeAgo(before(2 * 3600 + 59 * 60), now)).toBe("2 hours ago");
    expect(timeAgo(before(3 * 86_400 + 10), now)).toBe("3 days ago");
    expect(timeAgo(before(45 * 86_400), now)).toBe("last month");
  });

  it("names the day before", () => {
    expect(timeAgo(before(86_400), now)).toBe("yesterday");
  });
});

describe("exactDate", () => {
  it("shows the day and the time", () => {
    expect(exactDate(new Date("2026-10-18T15:04:00"))).toBe(
      "18 Oct 2026 · 3:04 PM",
    );
  });
});
