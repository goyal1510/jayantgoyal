'use client';

import { useState, useEffect } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  X,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PDFViewerModalProps {
  name: string;
  issuer: string;
  description?: string;
  path: string;
  onClose: () => void;
}

export function PDFViewerModal({ name, issuer, description, path, onClose }: PDFViewerModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    // Detect mobile/tablet - these often don't render PDFs well in embeds
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      // Also check user agent for mobile browsers
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile((isTouchDevice && isSmallScreen) || mobileUA);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const showMobileView = isMobile || embedFailed;

  // Add PDF parameters to fit the entire page in view (no scrolling needed)
  const pdfPath = `${path}#view=Fit&toolbar=0&navpanes=0`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold sm:text-xl">{name}</h2>
            <p className="truncate text-xs text-muted-foreground">{issuer}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" asChild variant="outline">
              <Link href={path} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                <span className="hidden sm:inline ml-1">Open</span>
              </Link>
            </Button>
            <Button size="sm" asChild variant="outline">
              <Link href={path} download>
                <Download className="size-4" />
                <span className="hidden sm:inline ml-1">Download</span>
              </Link>
            </Button>
            <button
              type="button"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-muted/80"
              onClick={onClose}
              aria-label="Close certificate"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-y-auto">
          {showMobileView ? (
            // Mobile-friendly view with prominent actions
            <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center" style={{ minHeight: "60vh" }}>
              <div className="flex size-24 items-center justify-center rounded-full bg-primary/10">
                <FileText className="size-12 text-primary" />
              </div>
              <div className="space-y-2 max-w-md">
                <h4 className="text-xl font-semibold">{name}</h4>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
                <p className="text-xs text-muted-foreground">Issued by {issuer}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link href={path} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-5" />
                    View Certificate
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <Link href={path} download>
                    <Download className="size-5" />
                    Download PDF
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            // Desktop embed view
            <object
              data={pdfPath}
              type="application/pdf"
              className="h-full w-full"
              style={{ minHeight: "70vh" }}
              onError={() => setEmbedFailed(true)}
            >
              {/* Fallback if object tag fails */}
              <div className="flex h-full flex-col items-center justify-center gap-4 p-8" style={{ minHeight: "60vh" }}>
                <p className="text-muted-foreground">Unable to display PDF in browser</p>
                <div className="flex gap-3">
                  <Button asChild>
                    <Link href={path} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 size-4" />
                      Open PDF
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={path} download>
                      <Download className="mr-2 size-4" />
                      Download
                    </Link>
                  </Button>
                </div>
              </div>
            </object>
          )}
        </div>
      </div>
    </div>
  );
}
