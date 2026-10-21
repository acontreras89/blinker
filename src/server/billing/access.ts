import { eq } from "drizzle-orm";
import { db } from "../db";
import { entitlements } from "../db/schema";
import { TRIAL_DOCUMENT_LIMIT } from "./rules";

export type Entitlement = typeof entitlements.$inferSelect;

/** What a user may do now; null means read and delete only. */
export type Access = {
  entitlement: Entitlement;
  /** Null when unlimited. */
  documentLimit: number | null;
};

// `past_due` keeps access while Stripe retries the payment; `unpaid`,
// `canceled`, `incomplete` and the rest don't.
const GRANTING = new Set(["active", "trialing", "past_due"]);

const grants = (e: Entitlement, now: Date) =>
  GRANTING.has(e.status) && (!e.cancelAt || e.cancelAt > now);

const limitOf = (e: Entitlement) =>
  e.status === "trialing" ? TRIAL_DOCUMENT_LIMIT : null;

/** Any row granting access now; a paid one wins over a trial. */
export function accessFrom(rows: Entitlement[], now: Date): Access | null {
  const best = rows
    .filter((e) => grants(e, now))
    .sort((a, b) => (limitOf(a) ?? Infinity) - (limitOf(b) ?? Infinity))
    .at(-1);
  return best ? { entitlement: best, documentLimit: limitOf(best) } : null;
}

export function getAccess(userId: string, now = new Date()) {
  const rows = db
    .select()
    .from(entitlements)
    .where(eq(entitlements.userId, userId))
    .all();
  return accessFrom(rows, now);
}

/** One trial per user: only if they never had a subscription. */
export function trialEligible(userId: string) {
  return !db
    .select({ id: entitlements.id })
    .from(entitlements)
    .where(eq(entitlements.userId, userId))
    .get();
}
