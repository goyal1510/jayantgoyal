"use client"

import * as React from "react"
import { FileList } from "@/components/file-manager/file-list"

export default function FilesPage({
  params,
}: {
  params: Promise<{ path?: string[] }>
}) {
  const [pathFromUrl, setPathFromUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    params.then((resolvedParams) => {
      // Convert path array to string (e.g., ["folder1", "folder2"] -> "/folder1/folder2/")
      // Next.js already decodes URL segments automatically, so segments are already decoded
      const path = resolvedParams.path && resolvedParams.path.length > 0
        ? `/${resolvedParams.path.join("/")}/`
        : "/"
      setPathFromUrl(path)
    })
  }, [params])

  // Don't render until we have the path from params
  // This ensures FileList gets the correct initialPath
  if (pathFromUrl === null) {
    return null // or a loading spinner
  }

  return <FileList initialPath={pathFromUrl} />
}
