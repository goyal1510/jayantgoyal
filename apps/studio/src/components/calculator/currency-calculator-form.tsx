"use client";

import * as React from "react";
import Link from "next/link";
import { Banknote, History, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { createCalculation } from "@/lib/calculator/client-calculations";
import { CURRENCY_DENOMINATIONS } from "@/lib/calculator/database";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { StudioWorkspaceHeader } from "@/components/studio/studio-workspace-header";

interface DenominationInput {
  denomination: number;
  count: string | number;
  total: number;
}

export function CurrencyCalculatorForm() {
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [denominations, setDenominations] = React.useState<DenominationInput[]>(
    CURRENCY_DENOMINATIONS.map((currency) => ({
      denomination: currency.value,
      count: "",
      total: 0,
    })),
  );

  const updateDenomination = (index: number, value: string) => {
    const updated = [...denominations];
    const current = updated[index];
    if (!current) return;

    updated[index] = { ...current, count: value };

    const numericValue = value === "" || value === "-" ? "0" : value;
    const parsedValue = parseInt(numericValue) || 0;
    updated[index].total = updated[index].denomination * parsedValue;

    setDenominations(updated);
  };

  const getTotalAmount = () =>
    denominations.reduce((total, denom) => total + denom.total, 0);

  const validateAndParseDenominations = () => {
    const validDenominations: { denomination: number; count: number }[] = [];

    for (const denom of denominations) {
      const countStr = denom.count.toString();
      let count = 0;

      if (countStr && countStr !== "" && countStr !== "-") {
        const countMatch = countStr.match(/^-?\d+$/);
        if (countMatch) {
          count = parseInt(countStr);
        } else {
          throw new Error(
            `Invalid count for ₹${denom.denomination}: "${countStr}". Only numbers allowed.`,
          );
        }
      }

      if (count !== 0) {
        validDenominations.push({
          denomination: denom.denomination,
          count,
        });
      }
    }

    return validDenominations;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const validDenominations = validateAndParseDenominations();
      if (!validDenominations.length) {
        alert("Please enter at least one denomination with valid numbers.");
        return;
      }

      setIsSubmitting(true);

      const now = new Date();
      const istDate = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      );
      const day = String(istDate.getDate()).padStart(2, "0");
      const month = String(istDate.getMonth() + 1).padStart(2, "0");
      const year = istDate.getFullYear();
      const hours = String(istDate.getHours()).padStart(2, "0");
      const minutes = String(istDate.getMinutes()).padStart(2, "0");
      const seconds = String(istDate.getSeconds()).padStart(2, "0");
      const istTimestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

      await createCalculation({
        note: note || undefined,
        ist_timestamp: istTimestamp,
        denominations: validDenominations,
      });

      setNote("");
      setDenominations(
        CURRENCY_DENOMINATIONS.map((currency) => ({
          denomination: currency.value,
          count: "",
          total: 0,
        })),
      );
      router.refresh();
    } catch (error) {
      console.error("Error creating calculation:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Error saving calculation. Please check your input.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = getTotalAmount();
  const totalTone = totalAmount >= 0 ? "text-emerald-600" : "text-destructive";

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6">
      <StudioWorkspaceHeader
        icon={Banknote}
        title="Currency Calculator"
        description="Count Indian currency denominations, see the running total instantly, and save the result with a useful note."
        tone="sage"
        actions={
          <Button
            asChild
            variant="ghost"
            className="h-11 rounded-xl border border-current/20 bg-white/20 px-5 text-current shadow-none hover:bg-white/35 hover:text-current dark:bg-black/10 dark:hover:bg-black/20"
          >
            <Link href="/calculator/history">
              <History className="size-4" />
              View history
            </Link>
          </Button>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
      >
        <section className="overflow-hidden rounded-[1.75rem] border border-border/80 bg-card">
          <div className="flex items-end justify-between gap-4 border-b border-border/70 p-5 sm:p-6">
            <div>
              <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[0.68rem] uppercase tracking-[0.15em] text-muted-foreground">
                Denominations
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">
                Enter note counts
              </h2>
            </div>
            <p className="hidden text-sm text-muted-foreground sm:block">
              Negative counts are supported
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="border-b border-border/70 bg-muted/25 text-left font-[family-name:var(--font-ibm-plex-mono)] text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-5 py-3 sm:px-6">Denomination</th>
                  <th className="w-40 px-4 py-3 text-center">Count</th>
                  <th className="w-44 px-5 py-3 text-right sm:px-6">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {denominations.map((denom, index) => (
                  <tr
                    key={denom.denomination}
                    className="border-b border-border/60 last:border-b-0 hover:bg-muted/20"
                  >
                    <td className="px-5 py-2.5 text-lg font-semibold sm:px-6">
                      ₹{denom.denomination}
                    </td>
                    <td className="px-4 py-2.5">
                      <Input
                        type="text"
                        inputMode="numeric"
                        aria-label={`Count for ₹${denom.denomination}`}
                        value={denom.count || ""}
                        onChange={(event) =>
                          updateDenomination(index, event.target.value)
                        }
                        placeholder="0"
                        className="h-10 rounded-xl text-center text-base shadow-none"
                      />
                    </td>
                    <td
                      className={`px-5 py-2.5 text-right text-base font-semibold sm:px-6 ${denom.total >= 0 ? "text-emerald-600" : "text-destructive"}`}
                    >
                      ₹{denom.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-20">
          <section className="rounded-[1.75rem] border border-[#bdc4a3] bg-[#d9ddc3] p-5 text-[#211512] dark:border-[#4b594b] dark:bg-[#29312a] dark:text-[#fff8ef] sm:p-6">
            <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[0.68rem] uppercase tracking-[0.15em] opacity-70">
              Running total
            </p>
            <p
              className={`mt-4 break-words text-4xl font-semibold tracking-[-0.05em] ${totalTone}`}
            >
              ₹{totalAmount.toLocaleString()}
            </p>
            <p className="mt-2 text-sm opacity-70">
              Updates as denomination counts change.
            </p>
          </section>

          <section className="space-y-4 rounded-[1.75rem] border border-border/80 bg-card p-5 sm:p-6">
            <div className="space-y-2">
              <label htmlFor="note" className="text-sm font-semibold">
                Calculation note
              </label>
              <Input
                id="note"
                placeholder="Morning shift, drawer A…"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="h-11 rounded-xl shadow-none"
              />
            </div>
            <Button
              type="submit"
              disabled={totalAmount === 0 || isSubmitting}
              className="h-12 w-full rounded-xl shadow-none"
            >
              <Save className="size-4" />
              {isSubmitting ? "Saving calculation" : "Save calculation"}
            </Button>
          </section>
        </aside>
      </form>
    </div>
  );
}
