"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Globe,
  IndianRupee,
  Calendar,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { Separator } from "@repo/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { setListingStatus } from "@/lib/jobs-api";
import {
  PriorityBadge,
  RecommendationBadge,
  ScoreBadge,
  STATUS_LABELS,
  StatusBadge,
} from "@/components/jobs/badges";
import { DraftPanel } from "@/components/jobs/draft-panel";
import { QaPanel } from "@/components/jobs/qa-panel";
import { AutofillButton } from "@/components/jobs/autofill-button";
import { useDynamicBreadcrumb } from "@/components/providers/breadcrumb-context";
import type {
  JobApplicationQaItem,
  JobApplicationStatus,
  JobListing,
} from "@/lib/types";

function formatINR(n: number | null) {
  if (!n) return null;
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function JobDetailClient({
  listing: initialListing,
  prevHref,
  nextHref,
  position,
  total,
}: {
  listing: JobListing;
  prevHref: string | null;
  nextHref: string | null;
  backHref: string;
  position: number | null;
  total: number;
}) {
  const [listing, setListing] = useState(initialListing);
  const [savingStatus, setSavingStatus] = useState(false);

  // Set breadcrumb to "{Title} @ {Company}"
  useDynamicBreadcrumb(`${listing.title} @ ${listing.company}`);

  const status = listing.application?.status ?? null;
  const priority = listing.application?.priority ?? null;
  const salary =
    listing.salary_min_inr || listing.salary_max_inr
      ? `${formatINR(listing.salary_min_inr) ?? ""}${
          listing.salary_max_inr &&
          listing.salary_max_inr !== listing.salary_min_inr
            ? ` – ${formatINR(listing.salary_max_inr)}`
            : ""
        }`.trim()
      : null;

  async function handleStatusChange(next: JobApplicationStatus | null) {
    setSavingStatus(true);
    try {
      const r = await setListingStatus(listing.id, next);
      setListing((prev) => ({ ...prev, application: r.data }));
      toast.success(next ? `Marked ${STATUS_LABELS[next]}` : "Cleared status");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  }

  function patchQa(qa: JobApplicationQaItem[]) {
    setListing((prev) => ({ ...prev, ai_application_qa: qa }));
  }

  return (
    <div className="space-y-3">
      {/* Compact title bar — score, title, company, source, location, salary, posted */}
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border bg-card p-3">
        <div className="flex min-w-0 items-start gap-3">
          <ScoreBadge score={listing.ai_score} />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-tight">
              {listing.title}
            </h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span className="font-medium">{listing.company}</span>
              {listing.source_kind && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                  {listing.source_kind}
                </Badge>
              )}
              {listing.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {listing.location}
                </span>
              )}
              {listing.is_remote && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" /> Remote
                </span>
              )}
              {listing.is_india && (
                <Badge variant="outline" className="h-4 px-1 text-[10px]">
                  IN OK
                </Badge>
              )}
              {salary && (
                <span className="flex items-center gap-1 tabular-nums">
                  <IndianRupee className="h-3 w-3" />
                  {salary}
                </span>
              )}
              {listing.posted_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {timeAgo(listing.posted_at)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {position !== null && total > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {position}/{total}
            </span>
          )}
          <div className="flex gap-1">
            <Button
              asChild={!!prevHref}
              variant="outline"
              size="icon"
              disabled={!prevHref}
              className="h-8 w-8"
              title="Previous"
            >
              {prevHref ? (
                <Link href={prevHref}>
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              ) : (
                <span><ChevronLeft className="h-4 w-4" /></span>
              )}
            </Button>
            <Button
              asChild={!!nextHref}
              variant="outline"
              size="icon"
              disabled={!nextHref}
              className="h-8 w-8"
              title="Next"
            >
              {nextHref ? (
                <Link href={nextHref}>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <span><ChevronRight className="h-4 w-4" /></span>
              )}
            </Button>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <AutofillButton listing={listing} />
          <Button asChild size="sm" className="h-8">
            <a href={listing.apply_url} target="_blank" rel="noreferrer">
              Apply
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>

      {/* Status / priority / recommendation strip */}
      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Pipeline
        </span>
        <StatusBadge status={status} />
        <PriorityBadge priority={priority} />
        <RecommendationBadge recommendation={listing.ai_recommendation} />
        {listing.ai_red_flags?.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="mr-1 h-3 w-3" />
            {listing.ai_red_flags.length} red flag
            {listing.ai_red_flags.length > 1 ? "s" : ""}
          </Badge>
        )}
        <div className="ml-auto">
          <Select
            value={status ?? "none"}
            onValueChange={(v) =>
              handleStatusChange(
                v === "none" ? null : (v as JobApplicationStatus)
              )
            }
            disabled={savingStatus}
          >
            <SelectTrigger className="h-7 w-[150px] text-xs">
              {savingStatus ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <SelectValue placeholder="Set status" />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— No status —</SelectItem>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action items */}
      <div className="space-y-3">
        <QaPanel listing={listing} onChange={patchQa} />
        {listing.ai_cover_letter && (
          <DraftPanel
            title="Cover letter draft"
            body={listing.ai_cover_letter}
          />
        )}
        {listing.ai_referral_message && (
          <DraftPanel
            title="Referral DM draft"
            body={listing.ai_referral_message}
          />
        )}
      </div>
    </div>
  );
}
