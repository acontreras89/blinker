// Runs once when the server starts, before it takes requests.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { assertBillingConfig } = await import("@/server/billing/stripe");
  assertBillingConfig();
}
