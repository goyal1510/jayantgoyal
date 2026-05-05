"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { fetchListings } from "@/lib/jobs-api";
import { FilterBar, type FilterBarState } from "@/components/jobs/filter-bar";
import { ListingsTable } from "@/components/jobs/listings-table";
import {
  filtersToApiQuery,
  filtersToQuery,
  parseFilters,
} from "@/components/jobs/filter-url";
import type { JobListing } from "@/lib/types";

const PAGE_SIZE = 25;

export function ListingsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<JobListing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const initialFromUrl = useMemo(
    () => parseFilters(searchParams),
    [searchParams]
  );
  const [state, setState] = useState<FilterBarState>(initialFromUrl);
  const [page, setPage] = useState(() =>
    Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
  );

  // Debounce search query
  const [debouncedQ, setDebouncedQ] = useState(state.q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(state.q), 300);
    return () => clearTimeout(t);
  }, [state.q]);

  const effective = useMemo(
    () => ({ ...state, q: debouncedQ }),
    [state, debouncedQ]
  );

  // Sync filter state to URL (replace, not push, so back button doesn't churn)
  useEffect(() => {
    const qs = filtersToQuery(effective, page);
    router.replace(`/jobs/listings${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [effective, page, router]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    effective.q,
    effective.india,
    effective.aiScored,
    effective.matchesKeywords,
    effective.minScore,
    effective.sort,
    effective.sourceKinds,
    effective.recommendations,
    effective.priorities,
    effective.statuses,
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filtersToApiQuery(effective, page, PAGE_SIZE);
      const r = await fetchListings(
        Object.fromEntries(params.entries()) as never
      );
      setListings(r.data);
      setTotal(r.total);
    } catch {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [effective, page]);

  useEffect(() => {
    load();
  }, [load]);

  const detailHrefBuilder = useCallback(
    (id: string) => {
      const qs = filtersToQuery(effective, page);
      return `/jobs/listings/${id}${qs ? `?${qs}` : ""}`;
    },
    [effective, page]
  );

  return (
    <div className="space-y-4">
      <FilterBar state={state} onChange={setState} resultCount={total} />

      <ListingsTable
        data={listings}
        loading={loading}
        detailHrefBuilder={detailHrefBuilder}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
