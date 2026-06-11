"use client";

import * as React from "react";
import Link from "next/link";
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  CheckCircle2,
  Eye,
  PackageOpen,
  PlusCircle,
  Search,
  XCircle,
} from "lucide-react";

import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Input } from "@repo/ui/input";
import { cn } from "@repo/ui/lib/utils";

import { CheckoutButton } from "@/components/commerce/checkout-button";
import {
  formatCommerceInterval,
  formatCommercePrice,
} from "@/lib/commerce/format";
import { getPublicProductDescription, getPublicProductName } from "@/lib/commerce/public-copy";
import type {
  CommerceProductType,
  CommerceProductWithPrices,
} from "@/lib/commerce/types";

type CatalogRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  productType: CommerceProductType;
  priceLabel: string;
  priceAmount: number;
  status: "ready" | "draft";
  primaryPriceId: string | null;
};

type FacetedOption = {
  label: string;
  value: string;
  count: number;
};

const typeLabels: Record<CommerceProductType, string> = {
  digital: "Digital",
  subscription: "Subscription",
  service: "Service",
  bundle: "Bundle",
};

const arrayFilter: FilterFn<CatalogRow> = (row, columnId, value) => {
  const selected = Array.isArray(value) ? value : [];
  if (selected.length === 0) return true;
  return selected.includes(String(row.getValue(columnId)));
};

const searchFilter: FilterFn<CatalogRow> = (row, _columnId, value) => {
  const query = String(value ?? "").trim().toLowerCase();
  if (!query) return true;

  const product = row.original;
  return [
    product.name,
    product.description,
    typeLabels[product.productType],
    product.priceLabel,
    product.status,
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
};

function priceLabel(product: CommerceProductWithPrices) {
  const primaryPrice = product.prices[0];
  if (!primaryPrice) return "Coming soon";

  return `${formatCommercePrice(
    primaryPrice.unit_amount,
    primaryPrice.currency,
  )}${formatCommerceInterval(primaryPrice.billing_interval)}`;
}

function toRows(products: CommerceProductWithPrices[]): CatalogRow[] {
  return products.map((product) => {
    const primaryPrice = product.prices[0];

    return {
      id: product.id,
      slug: product.slug,
      name: getPublicProductName(product),
      description: getPublicProductDescription(product),
      productType: product.product_type,
      priceLabel: priceLabel(product),
      priceAmount: primaryPrice?.unit_amount ?? Number.POSITIVE_INFINITY,
      status: primaryPrice ? "ready" : "draft",
      primaryPriceId: primaryPrice?.id ?? null,
    };
  });
}

function selectedValues<TData>(column: Column<TData, unknown>) {
  const value = column.getFilterValue();
  return Array.isArray(value) ? value.map(String) : [];
}

function FacetedFilter<TData>({
  column,
  title,
  options,
}: {
  column: Column<TData, unknown>;
  title: string;
  options: FacetedOption[];
}) {
  const values = selectedValues(column);
  const hasSelection = values.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 w-[134px] shrink-0 justify-start border-dashed px-3",
            hasSelection && "border-foreground/30 bg-muted/60 text-foreground",
          )}
        >
          <PlusCircle className="mr-2 size-4" />
          {title}
          <span
            className={cn(
              "mx-2 h-4 w-px bg-border",
              !hasSelection && "invisible",
            )}
          />
          <Badge
            variant="secondary"
            className={cn(
              "min-w-5 rounded-sm px-1 text-center font-normal",
              !hasSelection && "invisible",
            )}
          >
            {hasSelection ? values.length : ""}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>{title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => {
          const checked = values.includes(option.value);

          return (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={checked}
              onCheckedChange={() => {
                const next = checked
                  ? values.filter((value) => value !== option.value)
                  : [...values, option.value];
                column.setFilterValue(next.length ? next : undefined);
              }}
            >
              <span>{option.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {option.count}
              </span>
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortableHeader<TData>({
  column,
  label,
  align = "left",
}: {
  column: Column<TData, unknown>;
  label: string;
  align?: "left" | "center" | "right";
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 gap-1.5 px-0 text-sm font-medium text-muted-foreground hover:bg-transparent hover:text-foreground",
        align === "center" && "mx-auto justify-center",
        align === "right" && "ml-auto justify-end",
        align === "left" && "justify-start",
      )}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown className="size-3.5" />
    </Button>
  );
}

function typeOptions(rows: CatalogRow[]): FacetedOption[] {
  return (Object.keys(typeLabels) as CommerceProductType[])
    .map((value) => ({
      value,
      label: typeLabels[value],
      count: rows.filter((row) => row.productType === value).length,
    }))
    .filter((option) => option.count > 0);
}

function statusOptions(rows: CatalogRow[]): FacetedOption[] {
  return [
    {
      value: "ready",
      label: "Ready",
      count: rows.filter((row) => row.status === "ready").length,
    },
    {
      value: "draft",
      label: "Coming soon",
      count: rows.filter((row) => row.status === "draft").length,
    },
  ].filter((option) => option.count > 0);
}

function isCenteredColumn(columnId: string) {
  return (
    columnId === "productType" ||
    columnId === "priceAmount" ||
    columnId === "status" ||
    columnId === "actions"
  );
}

export function StoreCatalog({
  products,
}: {
  products: CommerceProductWithPrices[];
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");

  const rows = React.useMemo(() => toRows(products), [products]);

  const columns = React.useMemo<ColumnDef<CatalogRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <SortableHeader column={column} label="Product" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link
              href={`/store/${row.original.slug}`}
              className="font-medium hover:underline"
            >
              {row.original.name}
            </Link>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {row.original.description}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "productType",
        header: ({ column }) => (
          <SortableHeader column={column} label="Type" align="center" />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {typeLabels[row.original.productType]}
          </Badge>
        ),
        filterFn: arrayFilter,
      },
      {
        accessorKey: "priceAmount",
        header: ({ column }) => (
          <SortableHeader column={column} label="Price" align="center" />
        ),
        cell: ({ row }) => (
          <div className="text-center font-mono text-sm font-semibold">
            {row.original.priceLabel}
          </div>
        ),
        sortingFn: "basic",
      },
      {
        accessorKey: "status",
        header: () => (
          <div className="text-center text-sm font-medium text-muted-foreground">
            Status
          </div>
        ),
        cell: ({ row }) => (
          <div
            className={cn(
              "flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
              row.original.status === "ready"
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
            )}
          >
            <CheckCircle2 className="size-3.5" />
            {row.original.status === "ready" ? "Ready" : "Soon"}
          </div>
        ),
        filterFn: arrayFilter,
      },
      {
        id: "actions",
        header: () => (
          <div className="text-center text-sm font-medium text-muted-foreground">
            Actions
          </div>
        ),
        cell: ({ row }) => (
          <div className="inline-flex h-9 overflow-hidden rounded-full border bg-background shadow-xs">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-9 rounded-none shadow-none"
              title="Details"
              aria-label={`Details for ${row.original.name}`}
            >
              <Link href={`/store/${row.original.slug}`}>
                <Eye className="size-4" />
              </Link>
            </Button>
            <span className="my-2 w-px bg-border" />
            <CheckoutButton
              priceId={row.original.primaryPriceId}
              variant="ghost"
              size="icon"
              iconOnly
              ariaLabel={`Buy ${row.original.name}`}
              className="size-9 rounded-none shadow-none"
            />
          </div>
        ),
        enableSorting: false,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: searchFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const typeColumn = table.getColumn("productType");
  const statusColumn = table.getColumn("status");
  const hasFilters = columnFilters.length > 0 || globalFilter.trim().length > 0;

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-background p-8 text-center">
        <PackageOpen className="mx-auto size-10 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No products yet</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          Add a published product in admin to start selling from this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-background p-3 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Search products"
              className="h-9 pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {typeColumn ? (
              <FacetedFilter
                column={typeColumn}
                title="Type"
                options={typeOptions(rows)}
              />
            ) : null}
            {statusColumn ? (
              <FacetedFilter
                column={statusColumn}
                title="Status"
                options={statusOptions(rows)}
              />
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="h-9 shrink-0 px-3"
              disabled={!hasFilters}
              onClick={() => {
                setGlobalFilter("");
                setColumnFilters([]);
              }}
            >
              <XCircle className="mr-2 size-4" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
        <div className="hidden grid-cols-[minmax(0,1fr)_140px_140px_150px_128px] items-center gap-3 border-b bg-muted/35 px-4 py-2 lg:grid">
          {table.getHeaderGroups()[0]?.headers.map((header) => (
            <div
              key={header.id}
              className={cn(isCenteredColumn(header.column.id) && "flex justify-center")}
            >
              {header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext())}
            </div>
          ))}
        </div>
        <div>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <div
                key={row.id}
                className="grid gap-3 border-b px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_140px_140px_150px_128px] lg:items-center"
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className={cn(
                      cell.column.id !== "name" && "text-sm",
                      isCenteredColumn(cell.column.id) && "lg:flex lg:justify-center",
                    )}
                  >
                    <div className="mb-1 text-xs font-medium text-muted-foreground lg:hidden">
                      {cell.column.id === "productType"
                        ? "Type"
                        : cell.column.id === "priceAmount"
                          ? "Price"
                          : cell.column.id === "actions"
                            ? "Action"
                          : cell.column.id}
                    </div>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="px-4 py-10 text-center">
              <Search className="mx-auto size-9 text-muted-foreground" />
              <h3 className="mt-3 font-semibold">No match</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setGlobalFilter("");
                  setColumnFilters([]);
                }}
              >
                Clear search
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
