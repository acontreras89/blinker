import { z } from "zod";

// Shared by the forms and the backend: zod only, safe to import from client code.
// Password length is a signup rule only, so tightening it never locks out old
// accounts on login.
export const email = z.email();
export const signUpInput = z.object({
  name: z.string().trim().min(1).max(50),
  email,
  password: z.string().min(8).max(128),
});
export const signInInput = z.object({ email, password: z.string().min(1) });
