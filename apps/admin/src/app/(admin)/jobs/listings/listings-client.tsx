"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Search as SearchIcon,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Globe,
  IndianRupee,
  Calendar,
  Sparkles,
  AlertTriangle,
  Copy,
  Flag,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Badge } from "@repo/ui/badge";
import { Card, CardContent } from "@repo/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { Switch } from "@repo/ui/switch";
import { Label } from "@repo/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/collapsible";
import { fetchListings, setListingStatus } from "@/lib/jobs-api";
import type {
  JobAiRecommendation,
  JobApplicationStatus,
  JobListing,
  JobListingFilters,
  JobPriority,
  JobSourceKind,
} from "@/lib/types";

const STATUS_LABELS: Record<JobApplicationStatus, string> = {
  new: "New",
  interested: "Interested",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const STATUS_COLORS: Record<JobApplicationStatus, string> = {
  new: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  interested: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  applied: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  interviewing: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  offer: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  withdrawn: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const SOURCE_KINDS: Array<{ value: JobSourceKind | "all"; label: string }> = [
  { value: "all", label: "All sources" },
  { value: "remotive", label: "Remotive" },
  { value: "wwr", label: "WeWorkRemotely" },
  { value: "greenhouse", label: "Greenhouse" },
  { value: "lever", label: "Lever" },
  { value: "hn_hiring", label: "HN Who's Hiring" },
];

const RECOMMENDATIONS: Array<{ value: JobAiRecommendation | "all"; label: string }> = [
  { value: "all", label: "Any recommendation" },
  { value: "apply", label: "Apply" },
  { value: "apply_with_referral", label: "Apply (referral preferred)" },
  { value: "apply_if_time", label: "Apply if time permits" },
  { value: "skip", label: "Skip" },
  { value: "skip_red_flags", label: "Skip — red flags" },
];

const PRIORITY_COLORS: Record<JobPriority, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-amber-500 text-white",
  medium: "bg-blue-500 text-white",
  low: "bg-slate-400 text-white",
};

function scoreColor(score: number | null) {
  if (score == null) return "bg-muted text-muted-foreground";
  if (score >= 85) return "bg-green-600 text-white";
  if (score >= 70) return "bg-emerald-500 text-white";
  if (score >= 60) return "bg-amber-500 text-white";
  if (score >= 45) return "bg-orange-500 text-white";
  return "bg-rose-600 text-white";
}

function recommendationLabel(r: JobAiRecommendation | null) {
  if (!r) return null;
  return RECOMMENDATIONS.find((x) => x.value === r)?.label ?? r;
}

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

export function ListingsClient() {
  const [listings, setListings] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [india, setIndia] = useState(true);
  const [matchesKeywords, setMatchesKeywords] = useState(false);
  const [sourceKind, setSourceKind] = useState<JobSourceKind | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "none" | JobApplicationStatus>("all");
  const [aiScored, setAiScored] = useState(true);
  const [minAiScore, setMinAiScore] = useState<number>(60);
  const [recommendation, setRecommendation] = useState<JobAiRecommendation | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<JobPriority | "all">("all");
  const [sort, setSort] = useState<"ai_score" | "posted_at">("ai_score");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const filters: JobListingFilters = useMemo(
    () => ({
      q: debouncedQ || undefined,
      india: india || undefined,
      matches_keywords: matchesKeywords || undefined,
      source_kind: sourceKind === "all" ? undefined : sourceKind,
      status: statusFilter,
      ai_scored: aiScored || undefined,
      min_ai_score: aiScored ? minAiScore : undefined,
      recommendation: recommendation === "all" ? undefined : recommendation,
      priority: priorityFilter === "all" ? undefined : priorityFilter,
      sort,
      page,
      pageSize,
    }),
    [debouncedQ, india, matchesKeywords, sourceKind, statusFilter, aiScored, minAiScore, recommendation, priorityFilter, sort, page]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchListings(filters);
      setListings(r.data);
      setTotal(r.total);
    } catch {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, india, matchesKeywords, sourceKind, statusFilter, aiScored, minAiScore, recommendation, priorityFilter, sort]);

  async function updateStatus(listing: JobListing, next: JobApplicationStatus | null) {
    setSavingId(listing.id);
    try {
      const result = await setListingStatus(listing.id, next);
      setListings((prev) =>
        prev.map((l) => (l.id === listing.id ? { ...l, application: result.data } : l))
      );
      toast.success(next ? `Marked ${STATUS_LABELS[next]}` : "Cleared status");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setSavingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Job Listings</h1>
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString()} listings · India + your stack keywords by default
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="grid gap-3 lg:grid-cols-12">
            <div className="relative lg:col-span-4">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search title, company, description..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="lg:col-span-3">
              <Select value={sourceKind} onValueChange={(v) => setSourceKind(v as JobSourceKind | "all")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_KINDS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-3">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "none" | JobApplicationStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="none">No status</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <Select value={sort} onValueChange={(v) => setSort(v as "ai_score" | "posted_at")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_score">Sort: AI score</SelectItem>
                  <SelectItem value="posted_at">Sort: Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <Select value={recommendation} onValueChange={(v) => setRecommendation(v as JobAiRecommendation | "all")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECOMMENDATIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as JobPriority | "all")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-4 lg:col-span-7">
              <Label className="flex items-center gap-2 text-xs">
                <Switch checked={aiScored} onCheckedChange={setAiScored} />
                AI scored only
              </Label>
              {aiScored && (
                <Label className="flex items-center gap-2 text-xs">
                  Min score
                  <Input
                    type="number"
                    value={minAiScore}
                    onChange={(e) => setMinAiScore(Math.max(0, Math.min(100, parseInt(e.target.value || "0", 10))))}
                    className="h-7 w-16"
                  />
                </Label>
              )}
              <Label className="flex items-center gap-2 text-xs">
                <Switch checked={india} onCheckedChange={setIndia} />
                India only
              </Label>
              <Label className="flex items-center gap-2 text-xs">
                <Switch checked={matchesKeywords} onCheckedChange={setMatchesKeywords} />
                Match my stack keywords
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
        </div>
      ) : listings.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">No listings match your filters.</div>
      ) : (
        <div className="space-y-2">
          {listings.map((l) => (
            <ListingRow
              key={l.id}
              listing={l}
              saving={savingId === l.id}
              onStatusChange={(s) => updateStatus(l, s)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ListingRow({
  listing,
  saving,
  onStatusChange,
}: {
  listing: JobListing;
  saving: boolean;
  onStatusChange: (s: JobApplicationStatus | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const status = listing.application?.status ?? null;
  const salary =
    listing.salary_min_inr || listing.salary_max_inr
      ? `${formatINR(listing.salary_min_inr) ?? ""}${
          listing.salary_max_inr && listing.salary_max_inr !== listing.salary_min_inr
            ? ` – ${formatINR(listing.salary_max_inr)}`
            : ""
        }`.trim()
      : null;

  const priority = listing.application?.priority ?? null;

  return (
    <Card className={status === "rejected" ? "opacity-60" : ""}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {listing.ai_score != null && (
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md font-bold ${scoreColor(listing.ai_score)}`} title={listing.ai_reasoning ?? ""}>
                {listing.ai_score}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <CollapsibleTrigger asChild>
                  <button className="text-left font-semibold hover:underline">
                    {listing.title}
                  </button>
                </CollapsibleTrigger>
                <span className="text-sm text-muted-foreground">@ {listing.company}</span>
                {status && (
                  <Badge className={STATUS_COLORS[status]} variant="secondary">
                    {STATUS_LABELS[status]}
                  </Badge>
                )}
                {priority && (
                  <Badge className={PRIORITY_COLORS[priority]}>
                    <Flag className="mr-1 h-3 w-3" /> {priority}
                  </Badge>
                )}
                {listing.ai_recommendation && (
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="mr-1 h-3 w-3" /> {recommendationLabel(listing.ai_recommendation)}
                  </Badge>
                )}
                {listing.ai_red_flags?.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="mr-1 h-3 w-3" /> {listing.ai_red_flags.length} red flag{listing.ai_red_flags.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {listing.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {listing.location}
                  </span>
                )}
                {listing.is_remote && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" /> Remote
                  </span>
                )}
                {listing.is_india && <Badge variant="outline">India OK</Badge>}
                {salary && (
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" /> {salary} INR
                  </span>
                )}
                {listing.posted_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {timeAgo(listing.posted_at)}
                  </span>
                )}
                {listing.source_kind && (
                  <Badge variant="secondary" className="text-[10px]">
                    {listing.source_kind}
                  </Badge>
                )}
                {listing.tags?.slice(0, 5).map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button asChild size="sm" variant="outline">
                <a href={listing.apply_url} target="_blank" rel="noreferrer">
                  Apply <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
              <StatusActions saving={saving} current={status} onChange={onStatusChange} />
            </div>
          </div>
          <CollapsibleContent className="space-y-4 pt-4">
            {listing.ai_reasoning && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/40">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">
                  <Sparkles className="h-3 w-3" /> AI reasoning
                </div>
                <p>{listing.ai_reasoning}</p>
                {listing.ai_red_flags?.length > 0 && (
                  <ul className="mt-2 list-disc pl-4 text-xs text-red-700 dark:text-red-300">
                    {listing.ai_red_flags.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {listing.ai_cover_letter && (
              <DraftPanel title="Cover letter draft" body={listing.ai_cover_letter} />
            )}
            {listing.ai_referral_message && (
              <DraftPanel title="Referral DM draft" body={listing.ai_referral_message} />
            )}
            {listing.description_text ? (
              <details className="rounded-md border p-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase text-muted-foreground">
                  Full job description
                </summary>
                <div
                  className="prose prose-sm dark:prose-invert mt-2 max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: listing.description_html ?? listing.description_text,
                  }}
                />
              </details>
            ) : (
              <p className="text-sm text-muted-foreground">No description available.</p>
            )}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}

function DraftPanel({ title, body }: { title: string; body: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(body);
      toast.success(`${title} copied`);
    } catch {
      toast.error("Copy failed");
    }
  }
  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
          <Sparkles className="h-3 w-3" /> {title}
        </div>
        <Button variant="ghost" size="sm" onClick={copy} className="h-6 px-2">
          <Copy className="mr-1 h-3 w-3" /> Copy
        </Button>
      </div>
      <pre className="whitespace-pre-wrap text-sm leading-relaxed">{body}</pre>
    </div>
  );
}

function StatusActions({
  current,
  saving,
  onChange,
}: {
  current: JobApplicationStatus | null;
  saving: boolean;
  onChange: (s: JobApplicationStatus | null) => void;
}) {
  return (
    <Select
      value={current ?? "none"}
      onValueChange={(v) => onChange(v === "none" ? null : (v as JobApplicationStatus))}
      disabled={saving}
    >
      <SelectTrigger className="h-8 w-[140px]">
        {saving ? (
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
  );
}
