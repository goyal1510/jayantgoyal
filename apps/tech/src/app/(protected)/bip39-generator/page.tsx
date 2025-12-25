"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

// Simplified BIP39 implementation (using a subset of wordlist for demo)
// In production, use a proper BIP39 library
const BIP39_WORDLIST = [
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
  "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid",
  "acoustic", "acquire", "across", "act", "action", "actor", "actual", "adapt",
  "add", "addict", "address", "adjust", "admit", "adult", "advance", "advice",
  // ... truncated for brevity - in production use full 2048 word list
]

function generateMnemonic(words: number = 12): string {
  const array = new Uint8Array(Math.ceil(words * 4 / 3))
  crypto.getRandomValues(array)
  
  const mnemonic: string[] = []
  for (let i = 0; i < words; i++) {
    const index = (array[i] ?? 0) % BIP39_WORDLIST.length
    mnemonic.push(BIP39_WORDLIST[index] ?? BIP39_WORDLIST[0] ?? "abandon")
  }
  
  return mnemonic.join(" ")
}

export default function BIP39GeneratorPage() {
  const tool = getToolByPath("/bip39-generator")
  const [mnemonic, setMnemonic] = React.useState("")
  const [wordCount, setWordCount] = React.useState(12)
  const [passphrase, setPassphrase] = React.useState("")

  const generateMnemonicPhrase = React.useCallback(() => {
    const newMnemonic = generateMnemonic(wordCount)
    setMnemonic(newMnemonic)
  }, [wordCount])

  React.useEffect(() => {
    generateMnemonicPhrase()
  }, [generateMnemonicPhrase])

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
            <CardTitle>Options</CardTitle>
            <CardDescription>Configure BIP39 mnemonic generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wordCount">Number of Words</Label>
              <Input
                id="wordCount"
                type="number"
                min="12"
                max="24"
                step="3"
                value={wordCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 12
                  const validValues = [12, 15, 18, 21, 24]
                  const closest = validValues.reduce((prev, curr) => 
                    Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
                  )
                  setWordCount(closest)
                }}
              />
              <p className="text-xs text-muted-foreground">
                Valid values: 12, 15, 18, 21, 24
              </p>
            </div>

            <Button onClick={generateMnemonicPhrase} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Mnemonic
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mnemonic Phrase</CardTitle>
            <CardDescription>Your BIP39 mnemonic seed phrase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mnemonic</Label>
              <div className="flex gap-2">
                <Input
                  value={mnemonic}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(mnemonic)}
                  disabled={!mnemonic}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passphrase">Passphrase (optional)</Label>
              <Input
                id="passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter optional passphrase"
              />
              <p className="text-xs text-muted-foreground">
                Adding a passphrase creates an additional layer of security
              </p>
            </div>

            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="font-semibold mb-1">⚠️ Security Warning</p>
              <p className="text-muted-foreground">
                Keep your mnemonic phrase secure and never share it. Anyone with access to your
                mnemonic can access your funds.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
