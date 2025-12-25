"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const statusCodes = [
  { code: 200, name: "OK", category: "Success" },
  { code: 201, name: "Created", category: "Success" },
  { code: 204, name: "No Content", category: "Success" },
  { code: 301, name: "Moved Permanently", category: "Redirect" },
  { code: 302, name: "Found", category: "Redirect" },
  { code: 304, name: "Not Modified", category: "Redirect" },
  { code: 400, name: "Bad Request", category: "Client Error" },
  { code: 401, name: "Unauthorized", category: "Client Error" },
  { code: 403, name: "Forbidden", category: "Client Error" },
  { code: 404, name: "Not Found", category: "Client Error" },
  { code: 500, name: "Internal Server Error", category: "Server Error" },
  { code: 502, name: "Bad Gateway", category: "Server Error" },
  { code: 503, name: "Service Unavailable", category: "Server Error" },
]

export default function HTTPStatusCodesPage() {
  const tool = getToolByPath("/code-dev-tools/http-status-codes")
  const [search, setSearch] = React.useState("")
  const filtered = React.useMemo(() => {
    if (!search.trim()) return statusCodes
    const query = search.toLowerCase()
    return statusCodes.filter(
      (sc) =>
        sc.code.toString().includes(query) ||
        sc.name.toLowerCase().includes(query) ||
        sc.category.toLowerCase().includes(query)
    )
  }, [search])

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>Search HTTP status codes</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, or category..."
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((status) => (
          <Card key={status.code}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{status.code}</CardTitle>
                <span className={`text-xs px-2 py-1 rounded ${
                  status.category === "Success" ? "bg-green-500/20 text-green-600" :
                  status.category === "Redirect" ? "bg-blue-500/20 text-blue-600" :
                  status.category === "Client Error" ? "bg-yellow-500/20 text-yellow-600" :
                  "bg-red-500/20 text-red-600"
                }`}>
                  {status.category}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{status.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
