"use client"

import * as React from "react"
import { Cloud, Crown, Download, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import {
  type CustomCalculatorTemplate,
  type CustomCalculatorTemplateAccess,
} from "@/lib/custom-calculator/templates"
import { useCalculatorStore } from "@/lib/custom-calculator/useCalculatorStore"
import { Button } from "@repo/ui/button"
import { Input } from "@repo/ui/input"
import { cn } from "@repo/ui/lib/utils"

interface TemplateManagerProps {
  initialAccess: CustomCalculatorTemplateAccess
}

interface TemplatesResponse {
  templates: CustomCalculatorTemplate[]
  access: CustomCalculatorTemplateAccess
}

export default function TemplateManager({ initialAccess }: TemplateManagerProps) {
  const { components, darkMode, setComponents } = useCalculatorStore()
  const [templates, setTemplates] = React.useState<CustomCalculatorTemplate[]>([])
  const [access, setAccess] = React.useState(initialAccess)
  const [templateName, setTemplateName] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)

  const loadTemplates = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/custom-calculator/templates")
      const data = (await response.json().catch(() => null)) as TemplatesResponse | null
      if (!response.ok) {
        throw new Error((data as { error?: string } | null)?.error ?? "Unable to load templates.")
      }
      setTemplates(data?.templates ?? [])
      if (data?.access) setAccess(data.access)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load templates.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadTemplates()
  }, [loadTemplates])

  const saveTemplate = async () => {
    if (!components.length) {
      toast.error("Add calculator components before saving a template.")
      return
    }
    if (!templateName.trim()) {
      toast.error("Template name is required.")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/custom-calculator/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          components,
          darkMode,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to save template.")
      }
      setTemplateName("")
      toast.success("Template saved")
      await loadTemplates()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save template.")
    } finally {
      setIsSaving(false)
    }
  }

  const loadTemplate = (template: CustomCalculatorTemplate) => {
    setComponents(template.components)
    toast.success("Template loaded")
  }

  const deleteTemplate = async (template: CustomCalculatorTemplate) => {
    try {
      const response = await fetch(`/api/custom-calculator/templates/${template.id}`, {
        method: "DELETE",
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to delete template.")
      }
      setTemplates((current) => current.filter((item) => item.id !== template.id))
      toast.success("Template deleted")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete template.")
    }
  }

  return (
    <section className="rounded-lg border bg-background/80 p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Cloud className="h-4 w-4 text-sky-500" />
            Cloud templates
          </p>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {access.isPro
              ? `Save up to ${access.limit} custom calculator layouts and load them across sessions.`
              : "Build locally for free. Saving reusable cloud templates requires Pro."}
          </p>
        </div>

        {!access.isPro ? (
          <Button asChild size="sm" variant="outline">
            <Link href="/pricing">
              <Crown className="mr-2 h-4 w-4 text-amber-500" />
              Upgrade templates
            </Link>
          </Button>
        ) : (
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <Input
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              placeholder="Template name"
              className="h-10 sm:w-64"
              maxLength={80}
            />
            <Button onClick={saveTemplate} disabled={isSaving || !components.length}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      <div
        className={cn(
          "mt-4 grid gap-2",
          templates.length > 0 && "sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {isLoading ? (
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            No cloud templates saved yet.
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="flex min-h-16 items-center justify-between gap-3 rounded-md border bg-card px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{template.name}</p>
                <p className="text-xs text-muted-foreground">
                  {template.components.length} components
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Load ${template.name}`}
                  onClick={() => loadTemplate(template)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${template.name}`}
                  onClick={() => void deleteTemplate(template)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
