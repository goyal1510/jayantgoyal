import Link from "next/link"
import { allTools } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
  return (
    <div className="space-y-8">
      

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
