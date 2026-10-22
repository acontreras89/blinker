import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { db } from "../db";
import { signInInput, signUpInput } from "./rules";

const rules = { "/sign-up/email": signUpInput, "/sign-in/email": signInInput };

// Email/password with DB sessions (ADR-0003). Several sessions per user;
// sign-out revokes only the current one.
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite", usePlural: true }),
  // Dev from a phone on the LAN: Better Auth refuses origins other than
  // BETTER_AUTH_URL's unless trusted.
  trustedOrigins:
    process.env.NODE_ENV === "development" ? ["192.168.*", "10.*"] : [],
  emailAndPassword: { enabled: true, autoSignIn: true, minPasswordLength: 8 },
  // Built-in limiter, on in production. E2E turns it off: every scenario signs
  // up and logs in from the same address.
  rateLimit: {
    enabled: process.env.AUTH_RATE_LIMIT === "off" ? false : undefined,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const schema = rules[ctx.path as keyof typeof rules];
      if (schema && !schema.safeParse(ctx.body).success)
        throw new APIError("BAD_REQUEST", { message: "Invalid input" });
    }),
  },
});
