// Billing copy, in the product's voice (docs/DESIGN.md#voice); E8-04 polishes it.
export const billingCopy = {
  subscribe: "Subscribe to start writing",
  resubscribe: "Resubscribe to keep writing",
  startPaying: "Start paying now",
  manageBilling: "Manage billing",
  pastDue: "Your last payment failed. Fix your card before Stripe gives up.",
  notTheirs:
    "Trying to impersonate someone else, huh? Stop messing around and subscribe to start typing!",
  readOnly: {
    never: "Writing needs a subscription. Reading and deleting don't.",
    lapsed: "Your subscription has ended. Your documents are read-only.",
  },
  trialLimit: "Your trial includes 1 document.",
  trialLimitNext: "Pay now and write as many as you like.",
};

/** The way back to writing: subscribe, or resubscribe once they had one. */
export const ctaLabel = (had: boolean) =>
  had ? billingCopy.resubscribe : billingCopy.subscribe;

const dayFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
/** "Oct 24, 2026". */
export const day = (iso: string) => dayFormat.format(new Date(iso));
