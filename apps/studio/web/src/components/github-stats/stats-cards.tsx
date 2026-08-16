"use client";

import {
  Star,
  GitFork,
  BookOpen,
  Code2,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { m } from "framer-motion";
import type { GitHubStats } from "@jayantgoyal/github";

interface StatsCardsProps {
  stats: GitHubStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Stars",
      value: stats.totalStars.toLocaleString(),
      icon: Star,
      color: "text-yellow-500",
    },
    {
      label: "Total Forks",
      value: stats.totalForks.toLocaleString(),
      icon: GitFork,
      color: "text-blue-500",
    },
    {
      label: "Public Repos",
      value: stats.totalRepos.toLocaleString(),
      icon: BookOpen,
      color: "text-green-500",
    },
    {
      label: "Top Language",
      value: stats.mostUsedLanguage ?? "N/A",
      icon: Code2,
      color: "text-purple-500",
    },
    {
      label: "Avg Stars/Repo",
      value: stats.avgStarsPerRepo.toString(),
      icon: TrendingUp,
      color: "text-orange-500",
    },
    {
      label: "Account Age",
      value: `${Math.floor(stats.accountAgeDays / 365)}y ${Math.floor((stats.accountAgeDays % 365) / 30)}m`,
      icon: Calendar,
      color: "text-cyan-500",
    },
  ];

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-border/80 bg-card sm:grid sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card, i) => (
        <m.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="border-b border-border/70 p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:[&:nth-child(3)]:border-r-0 lg:[&:nth-child(3)]:border-r lg:last:border-r-0"
        >
          <card.icon className={`mb-5 size-5 ${card.color}`} />
          <p className="text-2xl font-semibold tracking-[-0.035em]">
            {card.value}
          </p>
          <p className="mt-1 font-[family-name:var(--font-ibm-plex-mono)] text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
            {card.label}
          </p>
        </m.div>
      ))}
    </div>
  );
}
