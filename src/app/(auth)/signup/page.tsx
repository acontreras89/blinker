import type { Metadata } from "next";
import { redirectIfLoggedIn } from "@/lib/session";
import { AuthPage } from "../_components/auth-form";
import { SignupForm } from "../_components/signup-form";

// Reads the session before rendering: blocking on purpose.
export const instant = false;
export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage() {
  // "Start typing" points here for everyone; a logged-in user skips the form
  // and gets the blank editor they asked for.
  await redirectIfLoggedIn("/write");
  return (
    <AuthPage
      title="Start typing."
      pitch="Name, email, password. Then it's just you and the cursor."
      switchTo={{
        question: "Already have an account?",
        href: "/login",
        label: "Log in",
      }}
    >
      <SignupForm />
    </AuthPage>
  );
}
