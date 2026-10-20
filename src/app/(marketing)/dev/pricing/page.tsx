import { notFound } from "next/navigation";
import { PRESETS, finePrint } from "../../_components/offer";
import { Pricing } from "../../_components/pricing";

// Dev-only preview of every offer preset (pick the live one in offer.ts).
export default function PricingPresets() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="wrap flex flex-col gap-16 py-12">
      {Object.entries(PRESETS).map(([name, plans]) => (
        <section key={name} aria-label={name}>
          <h2 className="mb-1 font-mono text-sm text-muted-foreground">
            PRESETS[&quot;{name}&quot;]
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Hero: {finePrint(plans)}
          </p>
          <Pricing plans={plans} />
        </section>
      ))}
    </div>
  );
}
