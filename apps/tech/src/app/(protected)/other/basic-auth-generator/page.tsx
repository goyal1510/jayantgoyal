"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

export default function BasicAuthGeneratorPage() {
  const tool = getToolByPath("/other/basic-auth-generator")
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [header, setHeader] = React.useState("")

  React.useEffect(() => {
    if (username && password) {
      const credentials = btoa(`${username}:${password}`)
      setHeader(`Basic ${credentials}`)
    } else {
      setHeader("")
    }
  }, [username, password])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(header)
    toast.success("Authorization header copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
        <CardHeader>
          <CardTitle>Credentials</CardTitle>
          <CardDescription>Enter username and password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
            />
          </div>
        </CardContent>
      </Card>

      {header && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Authorization Header</CardTitle>
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Input value={header} readOnly className="font-mono" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
