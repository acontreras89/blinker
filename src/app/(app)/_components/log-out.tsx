"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/** Revokes this device's session on the server; other devices keep theirs. */
export function LogOut() {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      aria-disabled={pending || undefined}
      onClick={async () => {
        if (pending) return;
        setPending(true);
        await authClient.signOut();
        location.replace("/login");
      }}
      className="ml-auto text-base font-medium text-muted-foreground hover:text-foreground"
    >
      Log out
    </button>
  );
}
