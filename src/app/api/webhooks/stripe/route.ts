import { handle } from "@/lib/api";

// Public mount of the Stripe webhook; the backend verifies the signature.
export const POST = handle;
