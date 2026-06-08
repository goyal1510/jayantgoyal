import type { Metadata } from "next"
import Link from "next/link"
import { allTools } from "@/lib/tools/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card"
import { Button } from "@repo/ui/button"

export const metadata: Metadata = {
  title: "Developer Tools",
  description: "99+ utilities for developers and power users including generators, converters, formatters, and more.",
}

export default function ToolsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tech Tools</h1>
          <p className="text-sm text-muted-foreground">
            Utilities with saved workspaces, bulk actions, and exportable results.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/tools/workspace">Open workspace</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allTools.map((tool) => {
          const Icon = tool.icon
          return (
            <Link key={tool.id} href={tool.path}>
              <Card className="h-full transition-colors hover:bg-accent">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{tool.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
