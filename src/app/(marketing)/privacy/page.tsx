import type { Metadata } from "next";
import { Legal } from "../_components/legal";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <Legal
      title="Privacy"
      lead="We keep what it takes to run an editor. Nothing else."
    >
      <h2>What we store</h2>
      <p>
        Your email, a hash of your password, your documents and, if you
        subscribe, your Stripe customer and subscription ids. Card details go to
        Stripe, never to us.
      </p>
      <h2>Cookies and storage</h2>
      <p>
        One session cookie to keep you logged in. The editor on the landing
        keeps its draft in your browser&apos;s local storage. No analytics, no
        trackers, no ads.
      </p>
    </Legal>
  );
}
