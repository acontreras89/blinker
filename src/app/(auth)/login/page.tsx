import type { Metadata } from "next";
import { redirectIfLoggedIn } from "@/lib/session";
import { safeNext } from "@/lib/safe-next";
import { AuthPage } from "../_components/auth-form";
import { LoginForm } from "../_components/login-form";

// Reads the session before rendering: blocking on purpose.
export const instant = false;
export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  await redirectIfLoggedIn("/app");
  const { next } = await searchParams;
  return (
    <AuthPage
      title="Back to it."
      pitch="The cursor kept your place. It also kept count."
      switchTo={{ question: "New here?", href: "/signup", label: "Sign up" }}
    >
      <LoginForm next={safeNext(typeof next === "string" ? next : null)} />
    </AuthPage>
  );
}
