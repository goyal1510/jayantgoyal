import { Search } from "lucide-react";

import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";

import { type AmountFilter, formatDateKeyLabel } from "./calculations-utils";

interface CalculationHistoryFiltersProps {
  searchTerm: string;
  amountFilter: AmountFilter;
  selectedDate: string | null;
  availableDates: string[];
  onSearchTermChange: (value: string) => void;
  onAmountFilterChange: (value: AmountFilter) => void;
  onSelectedDateChange: (value: string | null) => void;
  onResetPage: () => void;
}

export function CalculationHistoryFilters({
  searchTerm,
  amountFilter,
  selectedDate,
  availableDates,
  onSearchTermChange,
  onAmountFilterChange,
  onSelectedDateChange,
  onResetPage,
}: CalculationHistoryFiltersProps) {
  const clearFilters = () => {
    onSearchTermChange("");
    onAmountFilterChange("all");
    onSelectedDateChange(null);
    onResetPage();
  };

  return (
    <section
      className="rounded-[1.5rem] border border-border/80 bg-card p-4 sm:p-5"
      aria-label="Calculation filters"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap gap-3">
          <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-border/80 bg-background px-3 shadow-none">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Search by note, date, or amount"
              className="h-9 border-none bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-background px-3 py-2 text-sm">
            <span className="text-xs text-muted-foreground">Amount</span>
            <select
              value={amountFilter}
              onChange={(event) =>
                onAmountFilterChange(event.target.value as AmountFilter)
              }
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              <option value="all">All amounts</option>
              <option value="positive">Positive only</option>
              <option value="negative">Negative only</option>
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-background px-3 py-2 text-sm">
            <span className="text-xs text-muted-foreground">Date</span>
            <select
              value={selectedDate ?? ""}
              onChange={(event) => {
                onSelectedDateChange(event.target.value || null);
                onResetPage();
              }}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              <option value="">All dates</option>
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {formatDateKeyLabel(date)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          disabled={!searchTerm && amountFilter === "all" && !selectedDate}
        >
          Clear filters
        </Button>
      </div>
    </section>
  );
}
