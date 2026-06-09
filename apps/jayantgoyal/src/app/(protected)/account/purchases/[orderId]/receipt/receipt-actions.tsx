"use client"

import { Download, Printer } from "lucide-react"

import { Button } from "@repo/ui/button"

export function ReceiptActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={() => window.print()}>
        <Printer className="size-4" />
        Print
      </Button>
      <Button asChild variant="outline">
        <a href="#receipt">
          <Download className="size-4" />
          Save as PDF from print
        </a>
      </Button>
    </div>
  )
}
