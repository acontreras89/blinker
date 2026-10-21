import "server-only";
import { headers } from "next/headers";
import { api } from "./api";

// The user's plan, for Server Components and Server Actions. Each call
// forwards the request's cookie; the backend decides everything.
const auth = async () => ({
  headers: { cookie: (await headers()).get("cookie") ?? "" },
});

export type Plan = {
  status: string;
  trialEnd: string | null;
  periodEnd: string;
  cancelAt: string | null;
  documentLimit: number | null;
};

/** Their access now (null: read and delete only) and whether they ever paid. */
export async function getBilling(): Promise<{
  access: Plan | null;
  had: boolean;
}> {
  const res = await api.billing.$get(undefined, await auth());
  if (!res.ok) throw new Error(`Billing failed: ${res.status}`);
  return await res.json();
}

/** Where subscribing starts: Stripe's Checkout, or billing if already in. */
export async function checkoutUrl() {
  const res = await api.billing.checkout.$post(undefined, await auth());
  if (!res.ok) throw new Error(`Checkout failed: ${res.status}`);
  const body = await res.json();
  return "url" in body ? body.url : body.redirect;
}

export async function confirmReturn(sessionId: string) {
  const res = await api.billing.return.$post(
    { json: { sessionId } },
    await auth(),
  );
  if (!res.ok) throw new Error(`Return failed: ${res.status}`);
  return (await res.json()).status;
}

/** False when there was no trial to end. */
export async function endTrial() {
  const res = await api.billing.trial.end.$post(undefined, await auth());
  return res.ok;
}

/** Stripe's Customer Portal; null before they ever went to Checkout. */
export async function portalUrl() {
  const res = await api.billing.portal.$post(undefined, await auth());
  if (res.status === 409) return null;
  if (!res.ok) throw new Error(`Portal failed: ${res.status}`);
  return (await res.json()).url;
}
