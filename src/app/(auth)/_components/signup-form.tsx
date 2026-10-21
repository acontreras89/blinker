"use client";

import { useState } from "react";
import { checkout } from "@/app/(app)/billing/actions";
import { authClient } from "@/lib/auth-client";
import { email, signUpInput } from "@/server/auth/rules";
import {
  Field,
  FormAlert,
  Submit,
  genericError,
  useFieldErrors,
} from "./auth-form";

type Key = "name" | "email" | "password";

const copy = {
  nameMissing: "Tell us who you are. Any name will do.",
  nameLong: "50 characters, tops. It's a name, not a bio.",
  emailInvalid: "That's not an email. It needs an @ and a dot, at least.",
  passwordShort: "Too short. Give it 8 characters, the cursor can wait.",
  passwordLong: "128 characters, tops. Save the rest for the document.",
  emailTaken: "That email already has an account. Log in instead.",
};

// Messages for the shared rules (src/server/auth/rules.ts); the server
// enforces the same ones.
function validate(field: Key, value: string) {
  if (field === "name") {
    if (signUpInput.shape.name.safeParse(value).success) return;
    return value.trim() ? copy.nameLong : copy.nameMissing;
  }
  if (field === "email")
    return email.safeParse(value).success ? undefined : copy.emailInvalid;
  if (signUpInput.shape.password.safeParse(value).success) return;
  return value.length < 8 ? copy.passwordShort : copy.passwordLong;
}

export function SignupForm() {
  const [values, setValues] = useState({ name: "", email: "", password: "" });
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
    const { error } = await authClient.signUp.email({
      ...values,
      name: values.name.trim(),
    });
    // Registered: on to Checkout, then the editor. Should Checkout fail to
    // open, the dashboard offers it again.
    if (!error) return location.replace(await checkout().catch(() => "/app"));
    setPending(false);
    setAlert(error.status === 422 ? copy.emailTaken : genericError);
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <FormAlert>{alert}</FormAlert>
      <Field label="Name" autoComplete="name" {...bind("name")} />
      <Field
        label="Email"
        type="email"
        autoComplete="email"
        {...bind("email")}
      />
      <Field
        label="Password"
        type="password"
        autoComplete="new-password"
        {...bind("password")}
      />
      <Submit pending={pending}>Sign up</Submit>
    </form>
  );
}
