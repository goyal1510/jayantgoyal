"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle2, Code, Database, Download, FolderInput, FolderPlus, Layout, Package, Settings, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChangelogEntry {
  date: string
  version: string
  title: string
  type: "feature" | "fix" | "improvement" | "setup"
  items: string[]
  icon: React.ComponentType<{ className?: string }>
}

const changelog: ChangelogEntry[] = [
  {
    date: "2026-01-24",
    version: "Day 10",
    title: "File Operations (Rename, Move, Copy)",
    type: "feature",
    items: [
      "Created Move API with conflict detection and resolution",
      "Created Copy API with storage file duplication",
      "Built directory picker component with tree navigation",
      "Implemented Move and Copy dialogs with conflict resolution",
      "Added Replace, Cancel, and Keep Both options for conflicts",
      "Fixed RLS policy issues by using hard delete for Replace",
      "Updated parent_id correctly when moving files",
      "Handled copy to root directory edge case",
      "Fixed event propagation in context menu handlers"
    ],
    icon: FolderInput
  },
  {
    date: "2026-01-23",
    version: "Day 9",
    title: "File Download & Preview",
    type: "feature",
    items: [
      "Added download button to file viewer header",
      "Added download option to file context menus (grid and list views)",
      "Downloads use display name for user-friendly file naming",
      "Created FileThumbnail component for lazy-loaded image previews",
      "Image thumbnails in grid view with IntersectionObserver",
      "Thumbnail caching to prevent unnecessary API calls",
      "Blob-based download for proper file naming"
    ],
    icon: Download
  },
  {
    date: "2026-01-22",
    version: "Day 8",
    title: "File Upload & View",
    type: "feature",
    items: [
      "Created drag & drop file upload with progress tracking",
      "Implemented conflict resolution for duplicate files (replace/skip/rename)",
      "Built file viewer modal with support for images, PDFs, videos, and audio",
      "Added prev/next navigation and keyboard shortcuts in file viewer",
      "Persisted grid/list view preference to localStorage",
      "Added mobile-first responsive design with collapsible breadcrumbs",
      "Combined Upload and New Folder into single dropdown button",
      "Implemented tabular list view for desktop with column headers",
      "Added themed toast notifications matching dark/light mode"
    ],
    icon: Upload
  },
  {
    date: "2026-01-20",
    version: "Day 7",
    title: "Directory Management",
    type: "feature",
    items: [
      "Created API routes for folder creation, rename, and delete",
      "Implemented create folder dialog with path validation",
      "Built rename dialog supporting both files and folders",
      "Added delete confirmation dialog with soft delete",
      "Integrated context menu for quick file/folder actions",
      "Implemented recursive path updates for folder renames",
      "Added auto-refresh after all directory operations"
    ],
    icon: FolderPlus
  },
  {
    date: "2026-01-19",
    version: "Day 6",
    title: "File Listing & Directory Navigation",
    type: "feature",
    items: [
      "Created API route for listing directory contents with sorting",
      "Implemented FileList component with grid/list view toggle",
      "Added breadcrumb navigation for directory hierarchy",
      "Implemented sorting by name, date, size, and type",
      "Added loading states and error handling",
      "Fixed Supabase schema and permissions setup",
      "Resolved directory creation issues for root path"
    ],
    icon: Layout
  },
  {
    date: "2026-01-16",
    version: "Day 5",
    title: "UI Components Library",
    type: "feature",
    items: [
      "Created Dialog/Modal component",
      "Built comprehensive file and folder icon system",
      "Added Context Menu component for right-click actions",
      "Implemented Loading Spinner component with size variants",
      "Verified Toast/Notification setup (sonner)"
    ],
    icon: Package
  },
  {
    date: "2026-01-15",
    version: "Day 4",
    title: "Layout & Navigation",
    type: "feature",
    items: [
      "Created main layout component",
      "Designed and implemented sidebar navigation",
      "Created header with user menu",
      "Implemented breadcrumb navigation",
      "Added loading states and error boundaries",
      "Set up routing structure"
    ],
    icon: Layout
  },
  {
    date: "2026-01-14",
    version: "Day 3",
    title: "Authentication Setup & Sidebar",
    type: "feature",
    items: [
      "Set up Supabase Auth helpers for Next.js",
      "Created login and signup pages",
      "Implemented protected routes middleware",
      "Created user profile component (NavUser)",
      "Implemented sidebar navigation with all UI components",
      "Added theme provider (dark/light/system mode)",
      "Created account API routes"
    ],
    icon: Settings
  },
  {
    date: "2026-01-13",
    version: "Day 2",
    title: "Database Setup",
    type: "setup",
    items: [
      "Ran database schema from DATABASE-STRUCTURE-PLAN.md",
      "Created private-files storage bucket in Supabase",
      "Set up Supabase client utilities",
      "Created TypeScript types from database schema"
    ],
    icon: Database
  },
  {
    date: "2026-01-12",
    version: "Day 1",
    title: "Project Initialization",
    type: "setup",
    items: [
      "Initialized Next.js project with TypeScript",
      "Set up project structure (app directory, components, lib, types)",
      "Configured Tailwind CSS",
      "Set up ESLint and Prettier",
      "Created Supabase project",
      "Set up environment variables",
      "Installed dependencies: @supabase/supabase-js, @supabase/ssr",
      "Deployed to Vercel (fmanager.jayantgoyal.com)"
    ],
    icon: Code
  },
  {
    date: "2026-01-09",
    version: "Day 0",
    title: "Planning & Documentation",
    type: "setup",
    items: [
      "Created project plan and structure",
      "Designed database schema with fmanager schema",
      "Created DATABASE-STRUCTURE-PLAN.md with complete SQL schema",
      "Created PLAN.md with weekly day-wise development plan",
      "Set up sessions directory for tracking daily work",
      "Documented project requirements and features"
    ],
    icon: Code
  }
]

const typeColors = {
  feature: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  fix: "bg-red-500/10 text-red-500 border-red-500/20",
  improvement: "bg-green-500/10 text-green-500 border-green-500/20",
  setup: "bg-purple-500/10 text-purple-500 border-purple-500/20",
}

const typeLabels = {
  feature: "Feature",
  fix: "Fix",
  improvement: "Improvement",
  setup: "Setup",
}

export default function ChangelogPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center py-8">
        <h1 className="text-3xl font-bold tracking-tight">Release Notes</h1>
        <p className="text-muted-foreground">
          Track of all the work completed each day during development
        </p>
      </div>

      <div className="space-y-8">
        {changelog.map((entry, index) => {
          const Icon = entry.icon
          return (
            <Card key={index} className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg" />
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-lg bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{entry.title}</CardTitle>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", typeColors[entry.type])}
                        >
                          {typeLabels[entry.type]}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{entry.date}</span>
                        <span>•</span>
                        <span className="font-medium">{entry.version}</span>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {entry.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            This changelog is automatically updated as development progresses. 
            Each day's work is documented here for easy reference.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
