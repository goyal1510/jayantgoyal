"use client";

import { m } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@jayant/web-ui/card";
import type { LanguageDistribution } from "@jayant/github";

interface LanguagePieChartProps {
  data: LanguageDistribution[];
}

export function LanguagePieChart({ data }: LanguagePieChartProps) {
  if (data.length === 0) {
    return (
      <Card className="h-full rounded-[1.75rem] border-border/80 shadow-none">
        <CardHeader>
          <CardTitle>Language Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
          No language data available
        </CardContent>
      </Card>
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="h-full"
    >
      <Card className="h-full rounded-[1.75rem] border-border/80 shadow-none">
        <CardHeader className="border-b border-border/70 p-5 sm:p-6">
          <CardTitle className="text-2xl tracking-[-0.035em]">
            Language Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({
                  name,
                  percent,
                }: {
                  name?: string;
                  percent?: number;
                }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--card-foreground))",
                }}
                itemStyle={{ color: "hsl(var(--card-foreground))" }}
                labelStyle={{ color: "hsl(var(--card-foreground))" }}
                formatter={(value: number | undefined) => [
                  `${value ?? 0} repos`,
                  "Count",
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </m.div>
  );
}
