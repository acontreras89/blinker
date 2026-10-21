import { handle } from "@/lib/api";

// Test-only seeding for e2e; the backend answers 404 unless E2E_SEED=on.
export const POST = handle;
