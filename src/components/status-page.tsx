import { Cursor } from "@/components/cursor";
import { Wordmark } from "@/components/wordmark";

/** Full-page 404/500: what happened, then what's next. */
export function StatusPage({
  code,
  title,
  children,
  actions,
}: {
  code: number;
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <>
      <header className="wrap flex h-20 shrink-0 items-center">
        <Wordmark />
      </header>
      <main className="wrap flex flex-1 flex-col justify-center pb-[clamp(64px,14vh,160px)]">
        <p className="mb-3 font-semibold text-muted-foreground tabular-nums">
          {code}
        </p>
        <h1 className="mb-4 max-w-[14ch] text-title font-extrabold tracking-[-0.04em]">
          {title}
          <Cursor />
        </h1>
        <p className="mb-8 max-w-[40ch] text-[1.3rem] text-muted-foreground">
          {children}
        </p>
        <div className="flex flex-wrap items-center gap-6">{actions}</div>
      </main>
    </>
  );
}
