import { cn } from "cn";

/**
 * A line about the account, above the page's content: what's going on and,
 * if any, the one thing to do about it. Status colours mark the edge only.
 */
export function Notice({
  tone = "neutral",
  action,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  tone?: "neutral" | "warning" | "destructive";
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-l-3 px-4 py-3 text-[1rem]",
        {
          neutral: "border-l-foreground",
          warning: "border-l-warning",
          destructive: "border-l-destructive",
        }[tone],
        className,
      )}
      {...props}
    >
      <p className="min-w-[24ch] flex-1">{children}</p>
      {action}
    </div>
  );
}
