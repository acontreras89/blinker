"use server";

import { redirect } from "next/navigation";
import { checkoutUrl, confirmReturn, endTrial, portalUrl } from "@/lib/billing";

// The upgrade path's writes. The backend decides who gets what; these only
// send the user where it says.

/** To Stripe's Checkout, or to their billing page if they already have access. */
export async function subscribe() {
  redirect(await checkoutUrl());
}

/** The same, for code that navigates itself (signup). */
export async function checkout() {
  return await checkoutUrl();
}

/** Back from Checkout: ready, still pending, or not their Checkout. */
export async function checkReturn(sessionId: string) {
  return await confirmReturn(sessionId);
}

/** Ends the trial; false when there was none to end. */
export async function startPaying() {
  return await endTrial();
}

/** Ends the trial and opens a blank editor (the dashboard's way). */
export async function startPayingAndWrite() {
  await endTrial();
  redirect("/write");
}

export async function manageBilling() {
  redirect((await portalUrl()) ?? "/account/billing");
}
