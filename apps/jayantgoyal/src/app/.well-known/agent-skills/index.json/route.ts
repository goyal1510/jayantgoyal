import crypto from "crypto"

import { NextResponse } from "next/server"

export async function GET() {
  const skills = [
    {
      name: "developer-tools",
      type: "tool",
      description:
        "99+ developer utilities including UUID generator, JSON formatter, Base64 encoder, hash generators, regex tester, and more",
      url: "https://www.jayantgoyal.com/tools",
      digest: "",
    },
    {
      name: "portfolio",
      type: "content",
      description:
        "Full-stack developer portfolio with projects, skills, experience, and certifications",
      url: "https://www.jayantgoyal.com",
      digest: "",
    },
    {
      name: "weather",
      type: "tool",
      description:
        "Weather lookup with city search, geolocation, and 5-day forecast",
      url: "https://www.jayantgoyal.com/weather",
      digest: "",
    },
    {
      name: "github-stats",
      type: "tool",
      description:
        "GitHub profile explorer with contribution calendar, repository stats, and language breakdown",
      url: "https://www.jayantgoyal.com/github-stats",
      digest: "",
    },
  ]

  for (const skill of skills) {
    skill.digest = crypto
      .createHash("sha256")
      .update(JSON.stringify({ name: skill.name, url: skill.url }))
      .digest("hex")
  }

  return NextResponse.json({
    $schema: "https://agentskills.io/schema/v0.2.0",
    skills,
  })
}
