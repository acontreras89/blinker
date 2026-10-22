import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";
import { LogOut } from "./log-out";

/** The dashboard's and the billing page's header. */
export function AppHeader() {
  return (
    <header className="wrap flex h-20 shrink-0 items-center gap-6">
      <Wordmark href="/app" />
      <nav className="ml-auto flex items-center gap-6">
        <Link
          href="/account/billing"
          className="text-base font-medium text-muted-foreground hover:text-foreground"
        >
          Billing
        </Link>
        <LogOut />
        <ThemeToggle />
      </nav>
    </header>
  );
}
