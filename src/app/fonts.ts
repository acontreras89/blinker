import { Hanken_Grotesk } from "next/font/google";

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

/** `<html>` classes, shared by the root layout and global-error. */
export const fontClass = `${hanken.variable} h-full antialiased`;
