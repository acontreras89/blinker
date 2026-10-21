"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Cursor } from "@/components/cursor";
import { buttonVariants } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { checkReturn } from "../actions";

const RETRY_MS = 2_000;
const GIVE_UP_MS = 10_000;

const copy = {
  confirming: "Confirming payment…",
  confirmingNext: "Stripe is taking its time. The cursor is not.",
  late: "Not confirmed yet.",
  unlocksLater:
    "Stripe hasn't confirmed yet. Writing unlocks the moment it does.",
  dashboard: "Your documents",
};

/** Paid, but Stripe hasn't told us: ask again for a while, then say so. */
export function Confirming({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [late, setLate] = useState(false);

  useEffect(() => {
    const start = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    let gone = false;
    const ask = async () => {
      const status = await checkReturn(sessionId).catch(() => "pending");
      if (gone) return;
      if (status === "ready") return router.replace("/write");
      if (status === "invalid") return router.replace("/app?checkout=invalid");
      if (Date.now() - start >= GIVE_UP_MS) return setLate(true);
      timer = setTimeout(ask, RETRY_MS);
    };
    timer = setTimeout(ask, RETRY_MS);
    return () => {
      gone = true;
      clearTimeout(timer);
    };
  }, [sessionId, router]);

  return (
    <>
      <header className="wrap flex h-20 shrink-0 items-center">
        <Wordmark href="/app" />
      </header>
      <main className="wrap flex flex-1 flex-col justify-center pb-[clamp(64px,14vh,160px)]">
        <div role="status">
          <h1 className="mb-4 max-w-[16ch] text-title font-extrabold tracking-[-0.04em]">
            {late ? copy.late : copy.confirming}
            <Cursor />
          </h1>
          <p className="mb-8 max-w-[40ch] text-[1.3rem] text-muted-foreground">
            {late ? copy.unlocksLater : copy.confirmingNext}
          </p>
        </div>
        {late && (
          <div>
            <Link href="/app" className={buttonVariants({ size: "xl" })}>
              {copy.dashboard}
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
