"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Cursor } from "@/components/cursor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const genericError =
  "Something broke on our side, not yours. Try again in a moment.";

/** Heading, pitch and the way to the other auth page. */
export function AuthPage({
  title,
  pitch,
  children,
  switchTo,
}: {
  title: string;
  pitch: string;
  children: React.ReactNode;
  switchTo: { question: string; href: "/login" | "/signup"; label: string };
}) {
  return (
    <>
      <h1 className="mb-3 text-section font-extrabold tracking-[-0.03em]">
        {title}
        <Cursor />
      </h1>
      <p className="mb-8 text-[1.15rem] text-muted-foreground">{pitch}</p>
      {children}
      <p className="mt-8 text-[0.95rem] text-muted-foreground">
        {switchTo.question}{" "}
        <Link
          href={switchTo.href}
          className="font-semibold text-foreground underline-offset-4 hover:underline"
        >
          {switchTo.label}
        </Link>
      </p>
    </>
  );
}

type FieldProps = React.ComponentProps<typeof Input> & {
  label: string;
  error?: string;
};

/** A labelled input whose error is its accessible error message. */
export function Field({ label, error, ...input }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-[0.95rem] font-semibold">
        {label}
      </Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-errormessage={error ? errorId : undefined}
        aria-describedby={error ? errorId : undefined}
        className="h-11 px-3 text-base md:text-base"
        {...input}
      />
      {error && (
        <p id={errorId} className="text-[0.9rem] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** A form-wide problem, announced wherever it shows. */
export function FormAlert({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-[0.95rem] text-destructive"
    >
      {children}
    </p>
  );
}

export function Submit({
  pending,
  children,
}: {
  pending: boolean;
  children: string;
}) {
  return (
    <Button
      type="submit"
      size="xl"
      aria-disabled={pending || undefined}
      className="mt-2 w-full aria-disabled:opacity-60"
    >
      {children}
    </Button>
  );
}

/**
 * Field errors: all shown on submit, then each one re-checked live while the
 * user fixes it. Fields without an error stay quiet until the next submit.
 */
export function useFieldErrors<K extends string>(
  validate: (field: K, value: string) => string | undefined,
) {
  const [errors, setErrors] = useState<Partial<Record<K, string>>>({});
  return {
    errors,
    /** Checks every field; true when the form can be sent. */
    submit(values: Record<K, string>) {
      const next: Partial<Record<K, string>> = {};
      for (const field of Object.keys(values) as K[])
        next[field] = validate(field, values[field]);
      setErrors(next);
      return Object.values(next).every((e) => !e);
    },
    change(field: K, value: string) {
      if (errors[field])
        setErrors((e) => ({ ...e, [field]: validate(field, value) }));
    },
  };
}
