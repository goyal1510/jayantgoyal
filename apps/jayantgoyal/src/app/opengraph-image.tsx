import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const alt = "JG"
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
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
      </div>
    ),
    { ...size }
  )
}
