import {
  PRICE,
  TRIAL_DAYS,
  TRIAL_DOCUMENT_LIMIT,
} from "@/server/billing/rules";

// What we sell: monthly + trial (E6); the other presets wait for EX-05. The
// live plan's price and trial come from billing, so landing and Stripe agree.
export type Plan = {
  name: string;
  price: string;
  period: "month" | "once";
  trial?: { days: number; documents: number };
  pitch: string;
  joke?: string;
  cta: string;
  href: string;
};

const monthly: Plan = {
  name: "Monthly",
  price: `$${PRICE.amount / 100}`,
  period: PRICE.interval,
  pitch: "Unlimited documents. Cancel anytime.",
  cta: "Start typing",
  href: "/signup",
};

const withTrial: Plan = {
  ...monthly,
  trial: { days: TRIAL_DAYS, documents: TRIAL_DOCUMENT_LIMIT },
};

const pro: Plan = {
  name: "Pro",
  price: "$16",
  period: "month",
  pitch: "Everything in Monthly, plus version history.",
  joke: "Same cursor. It blinks with more conviction.",
  cta: "Go Pro",
  href: "/signup?plan=pro",
};

const lifetime: Plan = {
  name: "Lifetime",
  price: "$9,600",
  period: "once",
  pitch: "That's 100 years of Monthly. We did the math. No discount.",
  joke: "Planning to live past 100? Then it's a bargain.",
  cta: "Buy lifetime",
  href: "/signup?plan=lifetime",
};

export const PRESETS = {
  monthly: [monthly],
  trial: [withTrial],
  lifetime: [monthly, lifetime],
  "trial + lifetime": [withTrial, lifetime],
  pro: [monthly, pro],
  everything: [withTrial, pro, lifetime],
} satisfies Record<string, Plan[]>;

/** The live offer. The first plan is the main one. */
export const OFFER: Plan[] = PRESETS.trial;

const disappointed = "Cancel whenever. We'll be disappointed, not surprised.";

export function finePrint(plans: Plan[]): string {
  const trial = plans.find((p) => p.trial)?.trial;
  if (trial) return `${trial.days} days free, card required. ${disappointed}`;
  return `${plans[0].price} a ${plans[0].period}. ${disappointed}`;
}

export function faq(plans: Plan[]): { q: string; a: string }[] {
  const main = plans[0];
  const trial = main.trial;
  return [
    {
      q: "Is there a free plan?",
      a: trial
        ? `No. There's a ${trial.days}-day trial with ${trial.documents === 1 ? "one document" : `up to ${trial.documents} documents`}. After that it's ${main.price} a month, or back to staring at your inbox.`
        : `No. The box at the top of this page is the free plan. Real documents are ${main.price} a month.`,
    },
    ...(trial
      ? [
          {
            q: "Why do you need my card for a free trial?",
            a: `So the trial turns into a subscription without you lifting a finger. Cancel before day ${trial.days} and you pay nothing.`,
          },
        ]
      : []),
    ...(plans.some((p) => p.period === "once")
      ? [
          {
            q: "Is Lifetime really for life?",
            a: "For 100 years, or until we stop blinking. Whichever comes first.",
          },
        ]
      : []),
    {
      q: "Where do my documents live?",
      a: "On our servers, not in your browser. Log out, log back in, they're still there.",
    },
    {
      q: "Does it have AI?",
      a: "No. You have a brain. It's been waiting for this.",
    },
    {
      q: "What happens to my documents if I cancel?",
      a: "You keep them. Editing comes back when you do.",
    },
  ];
}
