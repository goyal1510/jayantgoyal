import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Jayant — Full-Stack Developer Platform"
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
          overflow: "hidden",
        }}
      >
        {/* Decorative elements */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(6, 182, 212, 0.08)" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(139, 92, 246, 0.06)" }} />

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          {/* Name */}
          <div style={{ fontSize: 64, fontWeight: 800, color: "white", display: "flex", gap: 14 }}>
            <span>JAYANT</span>
          </div>

          {/* Tagline */}
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Full-Stack Developer Platform
          </div>

          {/* Divider */}
          <div style={{ width: 80, height: 2, background: "rgba(6, 182, 212, 0.4)", marginTop: 4, marginBottom: 4 }} />

          {/* Features grid */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: 900 }}>
            {[
              "Portfolio",
              "99+ Dev Tools",
              "Games",
              "File Manager",
              "Messenger",
              "Weather",
              "Activity Tracker",
              "Calculator",
            ].map((feature) => (
              <div
                key={feature}
                style={{
                  padding: "8px 18px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                {feature}
              </div>
            ))}
          </div>

          {/* Tech stack */}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            {["Next.js", "React", "TypeScript", "Supabase"].map((tech) => (
              <div
                key={tech}
                style={{
                  padding: "6px 16px",
                  borderRadius: 999,
                  background: "rgba(6, 182, 212, 0.12)",
                  color: "#06b6d4",
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                {tech}
              </div>
            ))}
          </div>
        </div>

        {/* URL */}
        <div style={{ position: "absolute", bottom: 36, fontSize: 18, color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em" }}>
          jayantgoyal.com
        </div>
      </div>
    ),
    { ...size }
  )
}
