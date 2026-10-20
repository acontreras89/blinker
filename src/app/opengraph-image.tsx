import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";

export const alt = `${brand.name}. ${brand.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (weight: 500 | 800) =>
  readFile(
    join(process.cwd(), `src/assets/fonts/hanken-grotesk-${weight}.woff`),
  );
const [medium, extraBold] = await Promise.all([font(500), font(800)]);

// The landing's light theme: black on white, the cursor in primary.
export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 96px",
        background: "#ffffff",
        fontFamily: "Hanken Grotesk",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          fontSize: 200,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: "#000000",
        }}
      >
        {brand.name}
        <div
          style={{
            width: 22,
            height: 170,
            marginLeft: 14,
            marginBottom: 12,
            background: "#d6006f",
          }}
        />
      </div>
      <div
        style={{
          marginTop: 36,
          fontSize: 60,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "#5c5f66",
        }}
      >
        {brand.tagline}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Hanken Grotesk", data: medium, weight: 500 },
        { name: "Hanken Grotesk", data: extraBold, weight: 800 },
      ],
    },
  );
}
