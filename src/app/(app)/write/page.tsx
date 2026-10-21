import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { Writer } from "../_components/writer";

export const instant = false;
export const metadata: Metadata = { title: "New document" };

export default async function Write() {
  await requireUser("/write");
  return <Writer />;
}
