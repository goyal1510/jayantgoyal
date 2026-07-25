import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { PERSON_BRAND } from "@repo/brand";

export const alt = `${PERSON_BRAND.fullName} — Software Engineer`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const favicon = await readFile(
    join(
      process.cwd(),
      "public/assets/Jayant_favicon_io/android-chrome-512x512.png",
    ),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 64,
          padding: 80,
          background: "#55aaff",
          color: "#112244",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <img
          alt="JG"
          src={`data:image/png;base64,${Buffer.from(favicon).toString("base64")}`}
          width={320}
          height={320}
          style={{ borderRadius: 64 }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span style={{ fontSize: 62, fontWeight: 800 }}>
            {PERSON_BRAND.fullName}
          </span>
          <span style={{ fontSize: 34, fontWeight: 600 }}>
            Software Engineer
          </span>
          <span style={{ fontSize: 24 }}>
            Portfolio · Experience · Work
          </span>
        </div>
      </div>
    ),
    size,
  );
}
