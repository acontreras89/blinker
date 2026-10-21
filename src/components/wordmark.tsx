import Link from "next/link";
import { Cursor } from "@/components/cursor";

/** The brand mark, linking home (the landing, or the dashboard in the app). */
export function Wordmark({ href = "/" }: { href?: "/" | "/app" }) {
  return (
    <Link
      href={href}
      className="text-[1.35rem] font-extrabold tracking-[-0.02em]"
    >
      Blinker
      <Cursor />
    </Link>
  );
}
