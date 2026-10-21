import { describe, expect, it } from "vitest";
import { accessFrom, type Entitlement } from "./access";
import { TRIAL_DOCUMENT_LIMIT } from "./rules";

const now = new Date("2026-10-21T12:00:00Z");
const later = new Date("2026-11-21T12:00:00Z");
const earlier = new Date("2026-10-01T12:00:00Z");

const row = (fields: Partial<Entitlement>): Entitlement => ({
  id: "sub_1",
  userId: "u1",
  kind: "subscription",
  status: "active",
  trialEnd: null,
  periodEnd: later,
  cancelAt: null,
  createdAt: earlier,
  updatedAt: earlier,
  ...fields,
});

describe("accessFrom", () => {
  it("is null without rows", () => {
    expect(accessFrom([], now)).toBeNull();
  });

  it.each(["active", "past_due"])("grants unlimited access when %s", (s) => {
    expect(accessFrom([row({ status: s })], now)?.documentLimit).toBeNull();
  });

  it("limits a trial to its documents", () => {
    const access = accessFrom([row({ status: "trialing" })], now);
    expect(access?.documentLimit).toBe(TRIAL_DOCUMENT_LIMIT);
  });

  it.each(["unpaid", "canceled", "incomplete", "incomplete_expired", "paused"])(
    "denies access when %s",
    (s) => {
      expect(accessFrom([row({ status: s })], now)).toBeNull();
    },
  );

  it("keeps access until a scheduled cancellation, then drops it", () => {
    expect(accessFrom([row({ cancelAt: later })], now)).not.toBeNull();
    expect(accessFrom([row({ cancelAt: earlier })], now)).toBeNull();
  });

  it("prefers a paid row over a trial", () => {
    const rows = [
      row({ id: "sub_trial", status: "trialing" }),
      row({ id: "sub_paid" }),
      row({ id: "sub_old", status: "canceled" }),
    ];
    expect(accessFrom(rows, now)?.entitlement.id).toBe("sub_paid");
  });
});
