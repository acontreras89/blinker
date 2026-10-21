import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "./api";

export type User = { id: string; name: string };

/** The logged-in user, or null. Forwards the request's cookie to the backend. */
export async function getUser(): Promise<User | null> {
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await api.session.$get(undefined, { headers: { cookie } });
  return (await res.json()).user;
}

/** Private pages: visitors go to log in and come back to `path` after. */
export async function requireUser(path: string): Promise<User> {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  return user;
}

/** Auth pages: a logged-in user has nothing to do there. */
export async function redirectIfLoggedIn(to: string) {
  if (await getUser()) redirect(to);
}
