"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";

/** What "Subscribe" does on Stripe: pay (or start the trial), then come back. */
export async function pay(id: string) {
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await api.api.e2e.billing.checkout[":id"].complete.$post(
    { param: { id } },
    { headers: { cookie } },
  );
  if (!res.ok) redirect("/app");
  redirect((await res.json()).successUrl);
}
