import Link from "next/link";
import { Suspense } from "react";
import { ThemeMenu } from "@/components/theme-menu";
import { Wordmark } from "@/components/wordmark";
import { buttonVariants } from "@/components/ui/button";
import { getUser } from "@/lib/session";

const navLink = "text-muted-foreground no-underline hover:text-foreground";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* Sticky, so the section links stay at hand while scrolling. */}
      <div className="sticky top-0 z-40 bg-background">
        <header className="wrap flex h-20 shrink-0 items-center gap-6">
          <Wordmark />
          <nav
            aria-label="Main"
            className="ml-auto flex items-center gap-6 text-base font-medium whitespace-nowrap"
          >
            <Link className={`${navLink} max-md:hidden`} href="/#editor">
              What it does
            </Link>
            <Link className={`${navLink} max-md:hidden`} href="/#pricing">
              Pricing
            </Link>
            <Link className={`${navLink} max-md:hidden`} href="/#faq">
              FAQ
            </Link>
            {/* Same width while the session is read, so nothing jumps. */}
            <Suspense
              fallback={
                <span aria-hidden="true" className="invisible">
                  Log in
                </span>
              }
            >
              <AccountLink />
            </Suspense>
            <ThemeMenu />
            <Link href="/signup" className={buttonVariants({ size: "xl" })}>
              Start typing
            </Link>
          </nav>
        </header>
      </div>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="wrap flex flex-wrap justify-between gap-4 pt-6 pb-24 text-[0.9rem] text-muted-foreground">
          <span>Blinker. Made by people who should also be writing.</span>
          <span className="flex gap-6">
            <Link className={navLink} href="/terms">
              Terms
            </Link>
            <Link className={navLink} href="/privacy">
              Privacy
            </Link>
            <span>© 2026</span>
          </span>
        </div>
      </footer>
    </>
  );
}

// Logged in, "Log in" becomes "Open app". "Start typing" needs no switch:
// signup sends a logged-in user straight to a blank editor.
async function AccountLink() {
  const user = await getUser();
  return user ? (
    <Link className={navLink} href="/app">
      Open app
    </Link>
  ) : (
    <Link className={navLink} href="/login">
      Log in
    </Link>
  );
}
