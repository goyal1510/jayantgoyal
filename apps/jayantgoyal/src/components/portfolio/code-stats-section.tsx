"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { m } from "framer-motion";
import { Code2, BookOpen, Languages, Trophy, Calendar } from "lucide-react";
import { Card, CardContent } from "@repo/ui/card";
import { Separator } from "@repo/ui/separator";
import { cn } from "@repo/ui/lib/utils";
import { AnimatedCounter, formatCompact } from "@/components/ui/animated-counter";
import type { GitHubLOCStats, LanguageLOCBreakdown } from "@/lib/github-stats/types";

interface CodeStatsSectionProps {
  githubUsername: string;
}

export function CodeStatsSection({ githubUsername }: CodeStatsSectionProps) {
  const [stats, setStats] = useState<GitHubLOCStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const res = await fetch(`/api/github-loc?username=${encodeURIComponent(githubUsername)}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: GitHubLOCStats = await res.json();
        if (!cancelled) {
          setStats(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, [githubUsername]);

  if (error) return null;

  return (
    <section id="code-stats" className="scroll-mt-20 px-4 sm:px-6 lg:px-8">
      <SectionHeader
        title="Code Stats"
        description="Lines of code across all repositories, fetched live from GitHub"
      />
      <Separator className="my-8" />
      {loading ? <StatsSkeletons /> : stats ? <StatsContent stats={stats} /> : null}
    </section>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true, amount: 0.3 }}
      className="text-center"
    >
      <div className="flex items-center justify-center gap-4">
        <span className="size-2 rounded-full bg-foreground" />
        <span className="h-px w-16 bg-foreground/30 sm:w-24" />
        <h2 className="whitespace-nowrap text-3xl font-bold text-foreground sm:text-4xl">
          {title}
        </h2>
        <span className="h-px w-16 bg-foreground/30 sm:w-24" />
        <span className="size-2 rounded-full bg-foreground" />
      </div>
      {description ? (
        <p className="mt-3 text-lg text-muted-foreground">{description}</p>
      ) : null}
    </m.div>
  );
}

function StatsSkeletons() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-10 animate-pulse rounded-full bg-muted" />
    </div>
  );
}

function StatsContent({ stats }: { stats: GitHubLOCStats }) {
  const formatLOC = useCallback((v: number) => formatCompact(v), []);

  const cards = useMemo(() => [
    {
      label: "Lines of Code",
      value: stats.totalLinesOfCode,
      icon: Code2,
      color: "text-emerald-500",
      format: formatLOC,
    },
    {
      label: "Repositories",
      value: stats.totalRepos,
      icon: BookOpen,
      color: "text-blue-500",
    },
    {
      label: "Languages",
      value: stats.totalLanguages,
      icon: Languages,
      color: "text-purple-500",
    },
    {
      label: "Top Language",
      value: 0,
      icon: Trophy,
      color: "text-yellow-500",
      textValue: stats.topLanguage ?? "N/A",
    },
    {
      label: "Years Coding",
      value: stats.yearsOfCoding,
      icon: Calendar,
      color: "text-cyan-500",
      suffix: "+",
    },
  ] as const, [stats, formatLOC]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card, i) => (
          <m.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            viewport={{ once: true }}
          >
            <Card className="h-full">
              <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                <card.icon className={cn("size-6", card.color)} />
                {"textValue" in card && card.textValue ? (
                  <p className="text-lg font-bold">{card.textValue}</p>
                ) : (
                  <p className="text-lg font-bold">
                    <AnimatedCounter
                      value={card.value}
                      format={"format" in card ? card.format : undefined}
                    />
                    {"suffix" in card ? card.suffix : null}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </CardContent>
            </Card>
          </m.div>
        ))}
      </div>
      <LanguageBar breakdown={stats.languageBreakdown} />
    </div>
  );
}

function LanguageBar({ breakdown }: { breakdown: LanguageLOCBreakdown[] }) {
  const top = breakdown.slice(0, 6);
  const otherPercentage = breakdown.slice(6).reduce((sum, l) => sum + l.percentage, 0);

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      viewport={{ once: true }}
      className="space-y-3"
    >
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        {top.map((lang) => (
          <m.div
            key={lang.name}
            className="h-full"
            style={{ backgroundColor: lang.color }}
            initial={{ width: 0 }}
            whileInView={{ width: `${lang.percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            title={`${lang.name}: ${lang.percentage.toFixed(1)}%`}
          />
        ))}
        {otherPercentage > 0 ? (
          <m.div
            className="h-full"
            style={{ backgroundColor: "#8b8b8b" }}
            initial={{ width: 0 }}
            whileInView={{ width: `${otherPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            title={`Other: ${otherPercentage.toFixed(1)}%`}
          />
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {top.map((lang) => (
          <div key={lang.name} className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span
              className="inline-block size-3 rounded-full"
              style={{ backgroundColor: lang.color }}
            />
            <span>{lang.name}</span>
            <span className="font-medium text-foreground">{lang.percentage.toFixed(1)}%</span>
          </div>
        ))}
        {otherPercentage > 0 ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="inline-block size-3 rounded-full bg-[#8b8b8b]" />
            <span>Other</span>
            <span className="font-medium text-foreground">{otherPercentage.toFixed(1)}%</span>
          </div>
        ) : null}
      </div>
    </m.div>
  );
}
