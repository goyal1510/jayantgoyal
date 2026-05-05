"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Wand2, Copy, ExternalLink } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/dialog";
import { buildAutofillScript, buildBookmarklet } from "./autofill-script";
import type { JobListing } from "@/lib/types";

export function AutofillButton({ listing }: { listing: JobListing }) {
  const [open, setOpen] = useState(false);

  const script = useMemo(
    () =>
      buildAutofillScript(listing.ai_application_qa ?? [], {
        title: listing.title,
        company: listing.company,
      }),
    [listing]
  );

  const bookmarklet = useMemo(() => buildBookmarklet(script), [script]);
  const fillableCount = (listing.ai_application_qa ?? []).filter(
    (q) => q.answer && q.field_name && !q.field_type?.includes("file")
  ).length;

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(script);
      toast.success("Autofill script copied — paste into the apply page console");
    } catch {
      toast.error("Copy failed");
    }
  }

  async function copyBookmarklet() {
    try {
      await navigator.clipboard.writeText(bookmarklet);
      toast.success("Bookmarklet copied — create a bookmark and paste this as the URL");
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          disabled={fillableCount === 0}
          title={
            fillableCount === 0
              ? "Run /prepare-application first to populate Q&A"
              : `Fill ${fillableCount} text fields automatically`
          }
        >
          <Wand2 className="mr-1 h-3.5 w-3.5" />
          Autofill
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Autofill the application form</DialogTitle>
          <DialogDescription>
            Two ways to use this — pick whichever fits your habits. Both run the
            same code, which fills text fields by their{" "}
            <code className="rounded bg-muted px-1 text-xs">name</code> attribute
            using the Q&amp;A you&apos;ve prepped for this listing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <strong>What works:</strong> plain text / email / phone / URL inputs,
            textareas (resume body, cover letter), native select dropdowns.{" "}
            <strong>Manual still:</strong> file uploads (browser security forbids
            JS uploads), Greenhouse/Lever custom dropdowns (the script logs the
            label you should pick — open the console to see the list).
          </div>

          <div className="rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <strong className="text-sm">Option A — Console paste (one-off)</strong>
              <Button size="sm" onClick={copyScript}>
                <Copy className="mr-1 h-3 w-3" /> Copy script
              </Button>
            </div>
            <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
              <li>Click <strong>Apply</strong> to open the form in a new tab.</li>
              <li>
                Open the browser console: <kbd className="rounded border bg-muted px-1.5 text-xs">⌘ ⌥ J</kbd>{" "}
                (Mac) or <kbd className="rounded border bg-muted px-1.5 text-xs">Ctrl ⇧ J</kbd> (Win/Linux).
              </li>
              <li>
                Paste the script and press <kbd className="rounded border bg-muted px-1.5 text-xs">Enter</kbd>.
                Filled / manual fields are logged.
              </li>
            </ol>
          </div>

          <div className="rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <strong className="text-sm">Option B — Bookmarklet (set up once, reuse)</strong>
              <Button size="sm" variant="outline" onClick={copyBookmarklet}>
                <Copy className="mr-1 h-3 w-3" /> Copy bookmarklet
              </Button>
            </div>
            <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
              <li>
                Show your bookmarks bar (<kbd className="rounded border bg-muted px-1.5 text-xs">⌘ ⇧ B</kbd>),
                right-click → <em>Add page</em>.
              </li>
              <li>
                Name it{" "}
                <code className="rounded bg-muted px-1 text-xs">Jobs autofill</code> and paste the
                bookmarklet as the URL.
              </li>
              <li>
                Click <strong>Apply</strong> → on the form page, click the{" "}
                <em>Jobs autofill</em> bookmark. Done.
              </li>
            </ol>
            <p className="mt-2 text-xs text-muted-foreground">
              Note: each listing has its own bookmarklet (the data is inlined). Recopy from this
              dialog when you switch to a different listing.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button asChild variant="default">
              <a href={listing.apply_url} target="_blank" rel="noreferrer">
                Open apply page
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
