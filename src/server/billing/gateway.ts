// The port to the payment provider: Stripe in dev and prod, a fake in tests
// and e2e (`BILLING_GATEWAY=fake`). Only what billing reads or asks for.

export type Subscription = {
  id: string;
  customerId: string;
  status: string;
  trialEnd: Date | null;
  periodEnd: Date;
  cancelAt: Date | null;
};

export type Checkout = {
  id: string;
  customerId: string | null;
  url: string | null;
  status: "open" | "complete" | "expired";
  /** Settled: paid, or nothing to pay on a trial. */
  paid: boolean;
};

export type CheckoutInput = {
  customerId: string;
  trialDays: number | null;
  successUrl: string;
  cancelUrl: string;
};

export interface BillingGateway {
  createCustomer(user: {
    id: string;
    email: string;
    name: string;
  }): Promise<string>;
  createCheckout(input: CheckoutInput): Promise<Checkout>;
  getCheckout(id: string): Promise<Checkout | null>;
  findOpenCheckout(customerId: string): Promise<Checkout | null>;
  listSubscriptions(customerId: string): Promise<Subscription[]>;
  /** Ends a trial now: the first payment is taken at once. */
  endTrial(subscriptionId: string): Promise<void>;
  createPortal(customerId: string, returnUrl: string): Promise<string>;
}
