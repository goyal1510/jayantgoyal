"use client"

import { useState, useMemo } from "react"
import { ArrowUpDown, Star, GitFork, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { GitHubRepo } from "@/lib/github-stats/types"

type SortKey = "name" | "stargazers_count" | "forks_count" | "updated_at" | "language"
type SortDir = "asc" | "desc"

interface RepositoryTableProps {
  repos: GitHubRepo[]
}

export function RepositoryTable({ repos }: RepositoryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("stargazers_count")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const sorted = useMemo(() => {
    return [...repos].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name)
          break
        case "stargazers_count":
          cmp = a.stargazers_count - b.stargazers_count
          break
        case "forks_count":
          cmp = a.forks_count - b.forks_count
          break
        case "updated_at":
          cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          break
        case "language":
          cmp = (a.language ?? "").localeCompare(b.language ?? "")
          break
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [repos, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const SortButton = ({ label, field }: { label: string; field: SortKey }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 gap-1"
      onClick={() => toggleSort(field)}
    >
      {label}
      <ArrowUpDown className="size-3" />
    </Button>
  )

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
      <Card>
        <CardHeader>
          <CardTitle>All Repositories ({repos.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortButton label="Name" field="name" /></TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead><SortButton label="Language" field="language" /></TableHead>
                <TableHead><SortButton label="Stars" field="stargazers_count" /></TableHead>
                <TableHead><SortButton label="Forks" field="forks_count" /></TableHead>
                <TableHead><SortButton label="Updated" field="updated_at" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((repo) => (
                <TableRow key={repo.id}>
                  <TableCell className="font-medium">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:text-primary hover:underline"
                    >
                      {repo.name}
                      <ExternalLink className="size-3 opacity-50" />
                    </a>
                  </TableCell>
                  <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
                    {repo.description ?? "-"}
                  </TableCell>
                  <TableCell>
                    {repo.language ? (
                      <Badge variant="secondary">{repo.language}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Star className="size-3 text-yellow-500" />
                      {repo.stargazers_count}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <GitFork className="size-3 text-blue-500" />
                      {repo.forks_count}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(repo.updated_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  )
}
