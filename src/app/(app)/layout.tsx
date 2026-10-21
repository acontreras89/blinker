import { Wordmark } from "@/components/wordmark";
import { LogOut } from "./_components/log-out";

// Minimal app chrome until E5 (dashboard, chromeless editor) reshapes it.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="wrap flex h-20 shrink-0 items-center gap-6">
        <Wordmark href="/app" />
        <LogOut />
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
