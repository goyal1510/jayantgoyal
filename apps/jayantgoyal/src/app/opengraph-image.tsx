import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Jayant Goyal — Full-Stack Developer"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(6, 182, 212, 0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(6, 182, 212, 0.05)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Portfolio
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "white",
              display: "flex",
              gap: 16,
            }}
          >
            <span>HI, I&apos;M</span>
            <span style={{ color: "#06b6d4" }}>JAYANT</span>
          </div>
          <div
            style={{
              fontSize: 32,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Full Stack Developer
          </div>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 12,
            }}
          >
            {["Next.js", "React", "TypeScript", "Supabase"].map((tech) => (
              <div
                key={tech}
                style={{
                  padding: "8px 20px",
                  borderRadius: 999,
                  background: "rgba(6, 182, 212, 0.15)",
                  color: "#06b6d4",
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                {tech}
              </div>
            ))}
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 20,
            color: "rgba(255,255,255,0.3)",
          }}
        >
          jayantgoyal.com
        </div>
      </div>
    ),
    { ...size }
  )
}
