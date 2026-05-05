"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Badge } from "@repo/ui/badge";
import { Switch } from "@repo/ui/switch";
import { Label } from "@repo/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/popover";
import { ChipFilter, type ChipOption } from "./chip-filter";
import type {
  JobAiRecommendation,
  JobApplicationStatus,
  JobPriority,
  JobSourceKind,
} from "@/lib/types";

const SOURCE_OPTIONS: ChipOption[] = [
  { value: "remotive", label: "Remotive" },
  { value: "wwr", label: "WeWorkRemotely" },
  { value: "greenhouse", label: "Greenhouse" },
  { value: "lever", label: "Lever" },
  { value: "hn_hiring", label: "HN Who's Hiring" },
];

const RECOMMENDATION_OPTIONS: ChipOption[] = [
  { value: "apply", label: "Apply" },
  { value: "apply_with_referral", label: "Apply (referral)" },
  { value: "apply_if_time", label: "Apply if time" },
  { value: "skip", label: "Skip" },
  { value: "skip_red_flags", label: "Skip — red flags" },
];

const PRIORITY_OPTIONS: ChipOption[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const STATUS_OPTIONS: ChipOption[] = [
  { value: "none", label: "(no status)" },
  { value: "interested", label: "Interested" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "new", label: "New" },
];

export type FilterBarState = {
  q: string;
  sourceKinds: Set<JobSourceKind>;
  recommendations: Set<JobAiRecommendation>;
  priorities: Set<JobPriority>;
  statuses: Set<JobApplicationStatus | "none">;
  india: boolean;
  aiScored: boolean;
  matchesKeywords: boolean;
  minScore: number;
  sort: "ai_score" | "posted_at";
};

export const DEFAULT_FILTERS: FilterBarState = {
  q: "",
  sourceKinds: new Set(),
  recommendations: new Set(),
  priorities: new Set(),
  statuses: new Set(),
  india: true,
  aiScored: true,
  matchesKeywords: false,
  minScore: 50,
  sort: "ai_score",
};

function hasAnyFilter(s: FilterBarState) {
  return (
    s.q.trim() !== "" ||
    s.sourceKinds.size > 0 ||
    s.recommendations.size > 0 ||
    s.priorities.size > 0 ||
    s.statuses.size > 0 ||
    s.india !== DEFAULT_FILTERS.india ||
    s.aiScored !== DEFAULT_FILTERS.aiScored ||
    s.matchesKeywords !== DEFAULT_FILTERS.matchesKeywords ||
    s.minScore !== DEFAULT_FILTERS.minScore ||
    s.sort !== DEFAULT_FILTERS.sort
  );
}

function useInlineCount(ref: React.RefObject<HTMLDivElement | null>) {
  const [count, setCount] = useState(4);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const GAP = 8;
    const SEARCH_MIN = 220;
    const MORE_BTN = 140;
    const RESET_BTN = 90;
    const CHIP_AVG = 150;
    const calc = () => {
      const total = el.offsetWidth;
      const fixed = SEARCH_MIN + MORE_BTN + RESET_BTN + GAP * 3;
      const available = total - fixed;
      setCount(Math.max(0, Math.floor(available / (CHIP_AVG + GAP))));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return count;
}

type ChipDef =
  | {
      id: "source";
      label: "Source";
      options: ChipOption[];
      selected: Set<string>;
      onToggle: (v: string) => void;
      onClear: () => void;
    }
  | {
      id: "recommendation";
      label: "Recommendation";
      options: ChipOption[];
      selected: Set<string>;
      onToggle: (v: string) => void;
      onClear: () => void;
    }
  | {
      id: "priority";
      label: "Priority";
      options: ChipOption[];
      selected: Set<string>;
      onToggle: (v: string) => void;
      onClear: () => void;
    }
  | {
      id: "status";
      label: "Status";
      options: ChipOption[];
      selected: Set<string>;
      onToggle: (v: string) => void;
      onClear: () => void;
    };

export function FilterBar({
  state,
  onChange,
  resultCount,
}: {
  state: FilterBarState;
  onChange: (next: FilterBarState) => void;
  resultCount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const maxInline = useInlineCount(ref);

  const patch = useCallback(
    <K extends keyof FilterBarState>(key: K, value: FilterBarState[K]) => {
      onChange({ ...state, [key]: value });
    },
    [state, onChange]
  );

  const toggleInSet = useCallback(<T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }, []);

  const chips = useMemo<ChipDef[]>(
    () => [
      {
        id: "source",
        label: "Source",
        options: SOURCE_OPTIONS,
        selected: state.sourceKinds as Set<string>,
        onToggle: (v) =>
          patch(
            "sourceKinds",
            toggleInSet(state.sourceKinds, v as JobSourceKind) as Set<JobSourceKind>
          ),
        onClear: () => patch("sourceKinds", new Set()),
      },
      {
        id: "recommendation",
        label: "Recommendation",
        options: RECOMMENDATION_OPTIONS,
        selected: state.recommendations as Set<string>,
        onToggle: (v) =>
          patch(
            "recommendations",
            toggleInSet(
              state.recommendations,
              v as JobAiRecommendation
            ) as Set<JobAiRecommendation>
          ),
        onClear: () => patch("recommendations", new Set()),
      },
      {
        id: "priority",
        label: "Priority",
        options: PRIORITY_OPTIONS,
        selected: state.priorities as Set<string>,
        onToggle: (v) =>
          patch(
            "priorities",
            toggleInSet(state.priorities, v as JobPriority) as Set<JobPriority>
          ),
        onClear: () => patch("priorities", new Set()),
      },
      {
        id: "status",
        label: "Status",
        options: STATUS_OPTIONS,
        selected: state.statuses as Set<string>,
        onToggle: (v) =>
          patch(
            "statuses",
            toggleInSet(
              state.statuses,
              v as JobApplicationStatus | "none"
            ) as Set<JobApplicationStatus | "none">
          ),
        onClear: () => patch("statuses", new Set()),
      },
    ],
    [state, patch, toggleInSet]
  );

  const inlineChips = chips.slice(0, maxInline);
  const overflowChips = chips.slice(maxInline);
  const overflowCount = overflowChips.reduce(
    (acc, c) => acc + c.selected.size,
    0
  );

  function reset() {
    onChange({
      ...DEFAULT_FILTERS,
      sourceKinds: new Set(),
      recommendations: new Set(),
      priorities: new Set(),
      statuses: new Set(),
    });
  }

  const isDirty = hasAnyFilter(state);

  return (
    <div className="space-y-3">
      <div ref={ref} className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={state.q}
            onChange={(e) => patch("q", e.target.value)}
            placeholder="Search title, company, description..."
            className="h-9 pl-9"
          />
        </div>

        {inlineChips.map((c) => (
          <ChipFilter
            key={c.id}
            label={c.label}
            options={c.options}
            selected={c.selected}
            onToggle={c.onToggle}
            onClear={c.onClear}
          />
        ))}

        {overflowChips.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 shrink-0 gap-1.5"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                More filters
                {overflowCount > 0 && (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {overflowCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-3" align="end">
              <div className="space-y-3">
                {overflowChips.map((c) => (
                  <div key={c.id}>
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {c.label}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {c.options.map((opt) => {
                        const sel = c.selected.has(opt.value);
                        return (
                          <button
                            key={opt.value}
                            onClick={() => c.onToggle(opt.value)}
                            className={`rounded border px-2 py-1 text-xs transition-colors ${sel ? "border-primary bg-primary text-primary-foreground" : "border-input hover:bg-accent"}`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-9 shrink-0 px-2"
          disabled={!isDirty}
          onClick={reset}
        >
          <XCircle className="mr-1.5 h-4 w-4" />
          Reset
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <Label className="flex items-center gap-2">
          <Switch
            checked={state.india}
            onCheckedChange={(v) => patch("india", v)}
          />
          India eligible only
        </Label>
        <Label className="flex items-center gap-2">
          <Switch
            checked={state.aiScored}
            onCheckedChange={(v) => patch("aiScored", v)}
          />
          AI scored only
        </Label>
        {state.aiScored && (
          <Label className="flex items-center gap-2">
            Min score
            <Input
              type="number"
              min={0}
              max={100}
              value={state.minScore}
              onChange={(e) =>
                patch(
                  "minScore",
                  Math.max(0, Math.min(100, parseInt(e.target.value || "0", 10)))
                )
              }
              className="h-7 w-16"
            />
          </Label>
        )}
        <Label className="flex items-center gap-2">
          <Switch
            checked={state.matchesKeywords}
            onCheckedChange={(v) => patch("matchesKeywords", v)}
          />
          Match my stack
        </Label>

        <div className="ml-auto flex items-center gap-2">
          {typeof resultCount === "number" && (
            <span className="text-muted-foreground">
              {resultCount.toLocaleString()} results
            </span>
          )}
          <Select
            value={state.sort}
            onValueChange={(v) => patch("sort", v as FilterBarState["sort"])}
          >
            <SelectTrigger className="h-7 w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ai_score">Sort: AI score</SelectItem>
              <SelectItem value="posted_at">Sort: Newest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
