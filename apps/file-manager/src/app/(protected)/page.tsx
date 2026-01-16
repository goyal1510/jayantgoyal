"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// Day 5 imports - commented out for now
// import { Button } from "@/components/ui/button"
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog"
// import {
//   ContextMenu,
//   ContextMenuContent,
//   ContextMenuItem,
//   ContextMenuSeparator,
//   ContextMenuSub,
//   ContextMenuSubContent,
//   ContextMenuSubTrigger,
//   ContextMenuTrigger,
// } from "@/components/ui/context-menu"
// import { FileIcon, FolderIcon, FileFolderIcon, getFileType } from "@/components/file-icons"
// import { Spinner, SpinnerWithText } from "@/components/ui/spinner"
// import { Folder, File, Package, Zap } from "lucide-react"

export default function HomePage() {
  // Day 5 state - commented out for now
  // const [dialogOpen, setDialogOpen] = React.useState(false)

  // Day 5 sample files - commented out for now
  // const sampleFiles = [
  //   { name: "document.pdf", type: "document" as const },
  //   { name: "photo.jpg", type: "image" as const },
  //   { name: "video.mp4", type: "video" as const },
  //   { name: "song.mp3", type: "audio" as const },
  //   { name: "spreadsheet.xlsx", type: "spreadsheet" as const },
  //   { name: "code.tsx", type: "code" as const },
  //   { name: "archive.zip", type: "archive" as const },
  //   { name: "readme.txt", type: "text" as const },
  //   { name: "unknown.xyz", type: "other" as const },
  // ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-muted-foreground">
          Day 4: Layout & Navigation complete! Here's what we've built so far.
        </p>
      </div>

      {/* Day 4 Components Showcase */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Layout & Navigation</CardTitle>
            <CardDescription>
              Protected routes with sidebar navigation and breadcrumbs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The application now has a complete layout system with:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc list-inside">
              <li>Protected route structure</li>
              <li>Collapsible sidebar navigation</li>
              <li>Breadcrumb navigation</li>
              <li>Theme toggle (dark/light/system)</li>
              <li>User profile menu</li>
              <li>Error boundaries</li>
              <li>Loading states</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              Complete authentication system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              User authentication features:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc list-inside">
              <li>Login and signup pages</li>
              <li>Guest login support</li>
              <li>Protected routes middleware</li>
              <li>User profile management</li>
              <li>Account deletion</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Day 5 Component Showcase - Commented out for now */}
      {/* <div className="grid gap-6 md:grid-cols-2">
        {/* File Icons Showcase */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              File Icons
            </CardTitle>
            <CardDescription>
              Different file types with automatic icon detection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {sampleFiles.map((file) => (
                <div
                  key={file.name}
                  className="flex flex-col items-center gap-2 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                >
                  <FileIcon name={file.name} size={32} />
                  <span className="text-xs text-center text-muted-foreground truncate w-full">
                    {file.name.split(".")[0]}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 pt-2 border-t">
              <div className="flex flex-col items-center gap-2">
                <FolderIcon size={32} />
                <span className="text-xs text-muted-foreground">Folder</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <FolderIcon isOpen size={32} />
                <span className="text-xs text-muted-foreground">Open</span>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* Dialog Component Showcase */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Dialog Component
            </CardTitle>
            <CardDescription>
              Modal dialogs for user interactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Open Dialog
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Example Dialog</DialogTitle>
                  <DialogDescription>
                    This is a sample dialog component. It can be used for
                    confirmations, forms, and other interactions.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    Dialog content goes here. You can add forms, buttons, or
                    any other content.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setDialogOpen(false)}>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <p className="text-xs text-muted-foreground">
              Click the button above to see the dialog in action
            </p>
          </CardContent>
        </Card> */}

        {/* Context Menu Showcase */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Context Menu
            </CardTitle>
            <CardDescription>
              Right-click to see the context menu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                  <div className="text-center space-y-2">
                    <File className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Right-click here
                    </p>
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem>
                  <File className="mr-2 h-4 w-4" />
                  Open
                </ContextMenuItem>
                <ContextMenuItem>
                  <Folder className="mr-2 h-4 w-4" />
                  Download
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem>Rename</ContextMenuItem>
                <ContextMenuItem>Copy</ContextMenuItem>
                <ContextMenuItem>Move</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuSub>
                  <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    <ContextMenuItem>Email</ContextMenuItem>
                    <ContextMenuItem>Copy link</ContextMenuItem>
                    <ContextMenuItem>Generate QR</ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuSeparator />
                <ContextMenuItem variant="destructive">
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </CardContent>
        </Card> */}

        {/* Spinner Showcase */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Spinner size="sm" />
              Loading Spinners
            </CardTitle>
            <CardDescription>
              Different spinner sizes for loading states
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <Spinner size="sm" />
                <span className="text-xs text-muted-foreground">Small</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="md" />
                <span className="text-xs text-muted-foreground">Medium</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="lg" />
                <span className="text-xs text-muted-foreground">Large</span>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t">
              <SpinnerWithText text="Loading files..." size="sm" />
              <SpinnerWithText text="Processing..." size="md" />
              <SpinnerWithText text="Uploading..." size="lg" />
            </div>
          </CardContent>
        </Card> */}
      {/* </div> */}

      {/* Progress Status */}
      <Card>
        <CardHeader>
          <CardTitle>Development Progress</CardTitle>
          <CardDescription>
            What we've completed so far
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Day 1: Project Initialization</span>
              <span className="text-sm text-muted-foreground">✅ Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Day 2: Database Setup</span>
              <span className="text-sm text-muted-foreground">✅ Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Day 3: Authentication & Sidebar</span>
              <span className="text-sm text-muted-foreground">✅ Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Day 4: Layout & Navigation</span>
              <span className="text-sm text-muted-foreground">✅ Complete</span>
            </div>
            {/* Day 5 - Commented out for now */}
            {/* <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Day 5: UI Components Library</span>
              <span className="text-sm text-muted-foreground">✅ Complete</span>
            </div> */}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-medium">Day 5: UI Components Library</span>
              <span className="text-sm text-muted-foreground">⏳ Next</span>
            </div>
            {/* <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-medium">Day 6: File Listing & Navigation</span>
              <span className="text-sm text-muted-foreground">⏳ Next</span>
            </div> */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
