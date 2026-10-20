/** Terms and Privacy: stubs until there is a real service behind them. */
export function Legal({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <article className="wrap py-[clamp(48px,9vh,112px)] [&_h2]:mt-10 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:max-w-[60ch] [&_p]:text-muted-foreground">
      <div className="max-w-[820px]">
        <h1 className="mb-4 text-section font-extrabold tracking-[-0.04em]">
          {title}
        </h1>
        <p className="!text-foreground text-[1.3rem]">{lead}</p>
        <p className="mt-6 rounded-lg border px-4 py-3 text-[0.95rem]">
          Placeholder. Blinker is a demo: payments run in Stripe test mode, no
          real card is ever charged, and accounts may be wiped without notice.
        </p>
        {children}
      </div>
    </article>
  );
}
