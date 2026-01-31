"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card"
import { Button } from "@repo/ui/button"
import { Copy } from "lucide-react"
import { toast } from "sonner"

const emojis = [
  "\u{1F600}", "\u{1F603}", "\u{1F604}", "\u{1F601}", "\u{1F606}", "\u{1F605}", "\u{1F923}", "\u{1F602}", "\u{1F642}", "\u{1F643}",
  "\u{1F609}", "\u{1F60A}", "\u{1F607}", "\u{1F970}", "\u{1F60D}", "\u{1F929}", "\u{1F618}", "\u{1F617}", "\u{1F61A}", "\u{1F619}",
  "\u{1F60B}", "\u{1F61B}", "\u{1F61C}", "\u{1F92A}", "\u{1F61D}", "\u{1F911}", "\u{1F917}", "\u{1F92D}", "\u{1F92B}", "\u{1F914}",
  "\u{1F910}", "\u{1F928}", "\u{1F610}", "\u{1F611}", "\u{1F636}", "\u{1F60F}", "\u{1F612}", "\u{1F644}", "\u{1F62C}", "\u{1F925}",
  "\u{1F60C}", "\u{1F614}", "\u{1F62A}", "\u{1F924}", "\u{1F634}", "\u{1F637}", "\u{1F912}", "\u{1F915}", "\u{1F922}", "\u{1F92E}",
  "\u{1F927}", "\u{1F975}", "\u{1F976}", "\u{1F636}\u200D\u{1F32B}\uFE0F", "\u{1F635}", "\u{1F635}\u200D\u{1F4AB}", "\u{1F92F}", "\u{1F920}", "\u{1F973}", "\u{1F978}",
  "\u{1F60E}", "\u{1F913}", "\u{1F9D0}", "\u{1F615}", "\u{1F61F}", "\u{1F641}", "\u2639\uFE0F", "\u{1F62E}", "\u{1F62F}", "\u{1F632}",
  "\u{1F633}", "\u{1F97A}", "\u{1F626}", "\u{1F627}", "\u{1F628}", "\u{1F630}", "\u{1F625}", "\u{1F622}", "\u{1F62D}", "\u{1F631}",
  "\u{1F616}", "\u{1F623}", "\u{1F61E}", "\u{1F613}", "\u{1F629}", "\u{1F62B}", "\u{1F971}", "\u{1F624}", "\u{1F621}", "\u{1F620}",
  "\u{1F92C}", "\u{1F608}", "\u{1F47F}", "\u{1F480}", "\u2620\uFE0F", "\u{1F4A9}", "\u{1F921}", "\u{1F479}", "\u{1F47A}", "\u{1F47B}",
  "\u{1F47D}", "\u{1F47E}", "\u{1F916}", "\u{1F63A}", "\u{1F638}", "\u{1F639}", "\u{1F63B}", "\u{1F63C}", "\u{1F63D}", "\u{1F640}",
  "\u{1F63F}", "\u{1F63E}", "\u{1F648}", "\u{1F649}", "\u{1F64A}", "\u{1F48B}", "\u{1F48C}", "\u{1F498}", "\u{1F49D}", "\u{1F496}",
]

export default function EmojiPickerClient() {
  const [selected, setSelected] = React.useState<string | null>(null)

  const copyToClipboard = (emoji: string) => {
    navigator.clipboard.writeText(emoji)
    toast.success("Emoji copied to clipboard")
    setSelected(emoji)
  }

  const getUnicode = (emoji: string): string => {
    return Array.from(emoji)
      .map(char => `U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}`)
      .join(" ")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Emoji Picker</CardTitle>
          <CardDescription>Click an emoji to copy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => copyToClipboard(emoji)}
                className="text-2xl p-2 rounded hover:bg-accent transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Emoji</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-6xl text-center">{selected}</div>
            <div className="text-center space-y-1">
              <p className="font-mono text-sm">Unicode: {getUnicode(selected)}</p>
              <Button variant="outline" onClick={() => copyToClipboard(selected)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
