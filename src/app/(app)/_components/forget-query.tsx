"use client";

import { useEffect } from "react";

/** Drops the URL's query once read: a reload doesn't tell the story again. */
export function ForgetQuery() {
  useEffect(() => {
    history.replaceState(null, "", location.pathname);
  }, []);
  return null;
}
