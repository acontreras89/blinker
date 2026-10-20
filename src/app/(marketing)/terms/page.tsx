import type { Metadata } from "next";
import { Legal } from "../_components/legal";

export const metadata: Metadata = { title: "Terms" };

export default function Terms() {
  return (
    <Legal title="Terms" lead="Short version: write. Don't break things.">
      <h2>Your words are yours</h2>
      <p>
        We store your documents so autosave works. We don&apos;t read them, sell
        them or feed them to anything.
      </p>
      <h2>Paying</h2>
      <p>
        Monthly renews until you cancel. Lifetime is paid once, for the next
        hundred years.
      </p>
      <h2>Behave</h2>
      <p>
        Don&apos;t attack the service or use it against other people. We close
        accounts that do.
      </p>
    </Legal>
  );
}
