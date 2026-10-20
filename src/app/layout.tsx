import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import { fontClass } from "./fonts";
import "./globals.css";

const title = `${brand.name}. ${brand.tagline}`;

export const metadata: Metadata = {
  // The public app URL; Better Auth needs the same one.
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000"),
  title: { default: title, template: `%s · ${brand.name}` },
  description: brand.description,
  openGraph: {
    siteName: brand.name,
    title,
    description: brand.description,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={fontClass}>
      <body className="flex min-h-full flex-col text-lg leading-[1.55]">
        {children}
      </body>
    </html>
  );
}
