"use client"

import { FileList } from "@/components/file-list"

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Files</h1>
        <p className="text-muted-foreground">
          Manage your files and folders
        </p>
      </div> */}

      <FileList initialPath="/" />
    </div>
  )
}
