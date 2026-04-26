import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    {
      linkset: [
        {
          anchor: "https://www.jayantgoyal.com",
          "service-desc": [
            {
              href: "https://www.jayantgoyal.com/.well-known/api-catalog",
              type: "application/linkset+json",
            },
          ],
        },
        {
          anchor: "https://www.jayantgoyal.com/api/contact",
          "service-desc": [
            {
              href: "https://www.jayantgoyal.com/api/contact",
              type: "application/json",
            },
          ],
        },
        {
          anchor: "https://www.jayantgoyal.com/api/github-loc",
          "service-desc": [
            {
              href: "https://www.jayantgoyal.com/api/github-loc",
              type: "application/json",
            },
          ],
        },
      ],
    },
    {
      headers: { "Content-Type": "application/linkset+json" },
    },
  )
}
