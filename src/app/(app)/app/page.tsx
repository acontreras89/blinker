import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/session";

export const instant = false;
export const metadata: Metadata = { title: "Your documents" };

// Placeholder: the document list arrives in E5-01.
export default async function Dashboard() {
  const user = await requireUser("/app");
  return (
    <div className="wrap flex flex-1 flex-col justify-center pb-[clamp(64px,14vh,160px)]">
      <p className="mb-3 font-semibold text-muted-foreground">
        Hi, {user.name}.
      </p>
      <h1 className="mb-4 max-w-[16ch] text-title font-extrabold tracking-[-0.04em]">
        Nothing here yet.
      </h1>
      <p className="mb-8 max-w-[40ch] text-[1.3rem] text-muted-foreground">
        Not a single document. The cursor is not judging. (It is.)
      </p>
      <div>
        <Link href="/write" className={buttonVariants({ size: "2xl" })}>
          Start typing
        </Link>
      </div>
    </div>
  );
}
