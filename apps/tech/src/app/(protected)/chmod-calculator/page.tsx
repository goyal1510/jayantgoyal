"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy } from "lucide-react"
import { toast } from "sonner"

function calculateChmod(owner: number, group: number, others: number): {
  octal: string
  binary: string
  symbolic: string
} {
  const octal = `${owner}${group}${others}`
  const binary = `${owner.toString(2).padStart(3, "0")}${group.toString(2).padStart(3, "0")}${others.toString(2).padStart(3, "0")}`
  
  const permissions = ["r", "w", "x"]
  const symbolic = [
    permissions.map((p, i) => (owner & (1 << (2 - i))) ? p : "-").join(""),
    permissions.map((p, i) => (group & (1 << (2 - i))) ? p : "-").join(""),
    permissions.map((p, i) => (others & (1 << (2 - i))) ? p : "-").join(""),
  ].join("")
  
  return { octal, binary, symbolic }
}

export default function ChmodCalculatorPage() {
  const tool = getToolByPath("/chmod-calculator")
  const [owner, setOwner] = React.useState(7)
  const [group, setGroup] = React.useState(5)
  const [others, setOthers] = React.useState(5)
  const [read, setRead] = React.useState({ owner: true, group: true, others: true })
  const [write, setWrite] = React.useState({ owner: true, group: false, others: false })
  const [execute, setExecute] = React.useState({ owner: true, group: true, others: true })

  const updateFromOctal = React.useCallback(() => {
    const ownerBits = owner.toString(2).padStart(3, "0")
    const groupBits = group.toString(2).padStart(3, "0")
    const othersBits = others.toString(2).padStart(3, "0")
    
    setRead({
      owner: ownerBits[0] === "1",
      group: groupBits[0] === "1",
      others: othersBits[0] === "1",
    })
    setWrite({
      owner: ownerBits[1] === "1",
      group: groupBits[1] === "1",
      others: othersBits[1] === "1",
    })
    setExecute({
      owner: ownerBits[2] === "1",
      group: groupBits[2] === "1",
      others: othersBits[2] === "1",
    })
  }, [owner, group, others])

  React.useEffect(() => {
    updateFromOctal()
  }, [updateFromOctal])

  const updateFromCheckboxes = React.useCallback(() => {
    const calcPerm = (r: boolean, w: boolean, x: boolean) => {
      return (r ? 4 : 0) + (w ? 2 : 0) + (x ? 1 : 0)
    }
    
    setOwner(calcPerm(read.owner, write.owner, execute.owner))
    setGroup(calcPerm(read.group, write.group, execute.group))
    setOthers(calcPerm(read.others, write.others, execute.others))
  }, [read, write, execute])

  React.useEffect(() => {
    updateFromCheckboxes()
  }, [read, write, execute])

  const result = calculateChmod(owner, group, others)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>Set permissions using checkboxes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="font-semibold">Owner</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={read.owner}
                      onChange={(e) => setRead({ ...read, owner: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span>Read</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={write.owner}
                      onChange={(e) => setWrite({ ...write, owner: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span>Write</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={execute.owner}
                      onChange={(e) => setExecute({ ...execute, owner: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span>Execute</span>
                  </label>
                </div>
              </div>

              <div>
                <Label className="font-semibold">Group</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={read.group}
                      onChange={(e) => setRead({ ...read, group: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span>Read</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={write.group}
                      onChange={(e) => setWrite({ ...write, group: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span>Write</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={execute.group}
                      onChange={(e) => setExecute({ ...execute, group: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span>Execute</span>
                  </label>
                </div>
              </div>

              <div>
                <Label className="font-semibold">Others</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={read.others}
                      onChange={(e) => setRead({ ...read, others: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span>Read</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={write.others}
                      onChange={(e) => setWrite({ ...write, others: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span>Write</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={execute.others}
                      onChange={(e) => setExecute({ ...execute, others: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span>Execute</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <Label>Owner (Octal)</Label>
                <Input
                  type="number"
                  min="0"
                  max="7"
                  value={owner}
                  onChange={(e) => setOwner(Math.max(0, Math.min(7, parseInt(e.target.value) || 0)))}
                />
              </div>
              <div className="space-y-2">
                <Label>Group (Octal)</Label>
                <Input
                  type="number"
                  min="0"
                  max="7"
                  value={group}
                  onChange={(e) => setGroup(Math.max(0, Math.min(7, parseInt(e.target.value) || 0)))}
                />
              </div>
              <div className="space-y-2">
                <Label>Others (Octal)</Label>
                <Input
                  type="number"
                  min="0"
                  max="7"
                  value={others}
                  onChange={(e) => setOthers(Math.max(0, Math.min(7, parseInt(e.target.value) || 0)))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>Calculated values</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Octal</Label>
              <div className="flex gap-2">
                <Input value={result.octal} readOnly className="font-mono text-2xl text-center font-bold" />
                <button
                  onClick={() => copyToClipboard(result.octal)}
                  className="px-3 border rounded-md hover:bg-accent"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Binary</Label>
              <div className="flex gap-2">
                <Input value={result.binary} readOnly className="font-mono" />
                <button
                  onClick={() => copyToClipboard(result.binary)}
                  className="px-3 border rounded-md hover:bg-accent"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Symbolic</Label>
              <div className="flex gap-2">
                <Input value={result.symbolic} readOnly className="font-mono" />
                <button
                  onClick={() => copyToClipboard(result.symbolic)}
                  className="px-3 border rounded-md hover:bg-accent"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Command</Label>
              <div className="flex gap-2">
                <Input value={`chmod ${result.octal} file`} readOnly className="font-mono" />
                <button
                  onClick={() => copyToClipboard(`chmod ${result.octal} file`)}
                  className="px-3 border rounded-md hover:bg-accent"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
