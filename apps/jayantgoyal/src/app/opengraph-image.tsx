import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const alt = "JG Portfolio Tools Projects"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OgImage() {
  const favicon = await readFile(
    join(process.cwd(), "public/assets/Jayant_favicon_io/android-chrome-512x512.png")
  )
  const faviconSrc = `data:image/png;base64,${Buffer.from(favicon).toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          background: "#55aaff",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 34,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <img
          alt="JG"
          src={faviconSrc}
          width={360}
          height={360}
          style={{
            borderRadius: 72,
          }}
        />
        <div
          style={{
            color: "#112244",
            display: "flex",
            alignItems: "center",
            gap: 22,
            fontSize: 46,
            fontWeight: 750,
            letterSpacing: 1.2,
            lineHeight: 1.1,
            textTransform: "uppercase",
          }}
        >
          <span>Portfolio</span>
          <span
            style={{
              background: "#112244",
              borderRadius: 999,
              display: "flex",
              height: 10,
              width: 10,
            }}
          />
          <span>Tools</span>
          <span
            style={{
              background: "#112244",
              borderRadius: 999,
              display: "flex",
              height: 10,
              width: 10,
            }}
          />
          <span>Projects</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
