"use client"

import { Star, GitFork, BookOpen, Code2, TrendingUp, Calendar } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import type { GitHubStats } from "@/lib/github-stats/types"

interface StatsCardsProps {
  stats: GitHubStats
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
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <Card className="h-full">
            <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
              <card.icon className={`size-6 ${card.color}`} />
              <p className="text-lg font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
