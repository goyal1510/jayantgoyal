import { TermsContent, TERMS_LAST_UPDATED } from "@/components/auth/terms-content"
import { Button } from "@repo/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { portfolioUrl } from "@/lib/platform/urls"

export const metadata: Metadata = {
  title: "Terms & Conditions",
}

export default function TermsConditionsPage() {
  return (
    <div className="min-h-svh bg-background">
      <div className="px-4 py-8 md:px-8 md:py-12">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="size-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Terms & Conditions
            </h1>
          </div>
          <p className="text-muted-foreground">
            Last Updated: {TERMS_LAST_UPDATED}
          </p>
        </div>

        {/* Content */}
        <ScrollArea className="h-auto">
          <div className="rounded-lg border bg-card p-6 md:p-8">
            <TermsContent />
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            If you have any questions about these terms, please{" "}
            <a
              href={portfolioUrl("/#contact")}
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              contact us
            </a>
            .
          </p>
          <Button asChild>
            <Link href="/">Continue to Site</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
