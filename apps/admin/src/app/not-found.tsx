"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-md space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-background p-6 shadow-sm">
            <FileQuestion className="size-16 text-muted-foreground" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight">404</h1>
          <h2 className="text-xl font-semibold text-foreground">Page Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="default">
            <Link href="/portfolio/hero">
              <Home className="mr-2 size-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 size-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}
