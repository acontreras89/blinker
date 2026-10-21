import { Wordmark } from "@/components/wordmark";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="wrap flex h-20 shrink-0 items-center">
        <Wordmark />
      </header>
      <main className="wrap flex flex-1 flex-col justify-center pt-8 pb-[clamp(64px,14vh,160px)]">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </>
  );
}
