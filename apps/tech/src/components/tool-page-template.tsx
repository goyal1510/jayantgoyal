import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tool } from "@/lib/tools"

interface ToolPageTemplateProps {
  tool: Tool
}

export function ToolPageTemplate({ tool }: ToolPageTemplateProps) {
  const Icon = tool.icon

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Icon className="h-8 w-8" />
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{tool.title}</h1>
          <p className="text-muted-foreground mt-1">{tool.description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tool Content</CardTitle>
          <CardDescription>
            This tool is coming soon. The functionality will be implemented here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p>Tool implementation coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

