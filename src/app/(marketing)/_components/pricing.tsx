import { cn } from "cn";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { Plan } from "./offer";

const card = "flex flex-col gap-3 rounded-2xl border p-[clamp(24px,4vw,36px)]";
const price =
  "text-[clamp(2.8rem,6vw,4rem)] leading-none font-extrabold tracking-[-0.04em] tabular-nums";

/** Any number of plans; a lone plan gets a second card saying that's all. */
export function Pricing({ plans }: { plans: Plan[] }) {
  return (
    <div
      className={cn(
        "grid gap-6",
        plans.length > 2 ? "lg:grid-cols-3" : "max-w-[920px] md:grid-cols-2",
      )}
    >
      {plans.map((plan, i) => (
        <div
          key={plan.name}
          className={cn(card, i === 0 && "border-2 border-foreground")}
        >
          <h3 className="text-xl font-semibold">{plan.name}</h3>
          <div className={price}>
            {plan.price}
            <small className="text-lg font-medium tracking-normal text-muted-foreground">
              {plan.period === "month" ? " / month" : " once"}
            </small>
          </div>
          {plan.trial && (
            <p className="text-muted-foreground">
              Start with {plan.trial.days} days free and{" "}
              {plan.trial.documents === 1
                ? "one document"
                : `up to ${plan.trial.documents} documents`}
              .
            </p>
          )}
          <p className="text-muted-foreground">{plan.pitch}</p>
          {plan.joke && <p className="font-semibold">{plan.joke}</p>}
          <Link
            href={plan.href}
            className={cn(
              buttonVariants({
                size: "xl",
                variant: i === 0 ? "default" : "outline",
              }),
              "mt-auto self-start",
            )}
          >
            {plan.cta}
          </Link>
        </div>
      ))}
      {plans.length === 1 && (
        <div className={card}>
          <h3 className="text-xl font-semibold">Other plans</h3>
          <div className={price}>None</div>
          <p className="text-muted-foreground">
            We thought about it. Then we went back to writing.
          </p>
          <p className="font-semibold">
            It&apos;s {plans[0].price} a {plans[0].period}. You&apos;ve spent
            more on things you never opened.
          </p>
        </div>
      )}
    </div>
  );
}
