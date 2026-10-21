"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { email } from "@/server/auth/rules";
import {
  Field,
  FormAlert,
  Submit,
  genericError,
  useFieldErrors,
} from "./auth-form";

type Key = "email" | "password";

const copy = {
  emailInvalid: "That's not an email. It needs an @ and a dot, at least.",
  passwordMissing: "The password, please. The cursor can't guess it.",
  badCredentials: "Wrong email or password. The cursor saw nothing.",
};

// Email format only: signup's password rules never apply here, so changing
// them can't lock anyone out.
function validate(field: Key, value: string) {
  if (field === "email")
    return email.safeParse(value).success ? undefined : copy.emailInvalid;
  return value ? undefined : copy.passwordMissing;
}

/** `next` is already safe: the page ran it through `safeNext`. */
export function LoginForm({ next }: { next: string }) {
  const [values, setValues] = useState({ email: "", password: "" });
  const { errors, submit, change } = useFieldErrors(validate);
  const [alert, setAlert] = useState<string>();
  const [pending, setPending] = useState(false);

  const bind = (field: Key) => ({
    value: values[field],
    error: errors[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      change(field, e.target.value);
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setAlert(undefined);
    if (!submit(values)) return;
    setPending(true);
    const { error } = await authClient.signIn.email(values);
    if (!error) return location.replace(next);
    setPending(false);
    setAlert(error.status === 401 ? copy.badCredentials : genericError);
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormAlert>{alert}</FormAlert>
      <Field
        label="Email"
        type="email"
        autoComplete="email"
        {...bind("email")}
      />
      <Field
        label="Password"
        type="password"
        autoComplete="current-password"
        {...bind("password")}
      />
      <Submit pending={pending}>Log in</Submit>
    </form>
  );
}
