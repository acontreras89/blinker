import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { confirmReturn } from "@/lib/billing";
import { requireUser } from "@/lib/session";
import { Confirming } from "./confirming";

export const instant = false;
export const metadata: Metadata = { title: "Confirming payment" };

/**
 * Checkout's `success_url`. The backend checks the session is theirs and
 * settled (ADR-0009); the redirect alone grants nothing.
 */
export default async function Return({
  searchParams,
}: PageProps<"/billing/return">) {
  const { session_id } = await searchParams;
  const sessionId = typeof session_id === "string" ? session_id : "";
  await requireUser(
    `/billing/return?session_id=${encodeURIComponent(sessionId)}`,
  );
  const status = sessionId ? await confirmReturn(sessionId) : "invalid";
  if (status === "ready") redirect("/write");
  if (status === "invalid") redirect("/app?checkout=invalid");
  return <Confirming sessionId={sessionId} />;
}
