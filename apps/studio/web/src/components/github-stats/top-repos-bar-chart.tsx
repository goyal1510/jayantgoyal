"use client";

import { m } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@jayant/web-ui/card";
import type { GitHubRepo } from "@jayant/github";

interface TopReposBarChartProps {
  repos: GitHubRepo[];
}

export function TopReposBarChart({ repos }: TopReposBarChartProps) {
  if (repos.length === 0) {
    return (
      <Card className="h-full rounded-[1.75rem] border-border/80 shadow-none">
        <CardHeader>
          <CardTitle>Top Repos by Stars</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
          No repository data available
        </CardContent>
      </Card>
    );
  }

  const chartData = repos.map((r) => ({
    name: r.name.length > 15 ? r.name.slice(0, 15) + "..." : r.name,
    stars: r.stargazers_count,
    forks: r.forks_count,
  }));

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="h-full"
    >
      <Card className="h-full rounded-[1.75rem] border-border/80 shadow-none">
        <CardHeader className="border-b border-border/70 p-5 sm:p-6">
          <CardTitle className="text-2xl tracking-[-0.035em]">
            Top Repos by Stars
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--card-foreground))",
                }}
              />
              <Bar
                dataKey="stars"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="forks"
                fill="hsl(var(--muted-foreground))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </m.div>
  );
}
