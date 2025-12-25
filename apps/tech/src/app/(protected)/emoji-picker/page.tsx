"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { toast } from "sonner"

const emojis = [
  "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
  "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙",
  "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔",
  "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥",
  "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮",
  "🤧", "🥵", "🥶", "😶‍🌫️", "😵", "😵‍💫", "🤯", "🤠", "🥳", "🥸",
  "😎", "🤓", "🧐", "😕", "😟", "🙁", "☹️", "😮", "😯", "😲",
  "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱",
  "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠",
  "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻",
  "👽", "👾", "🤖", "😺", "😸", "😹", "😻", "😼", "😽", "🙀",
  "😿", "😾", "🙈", "🙉", "🙊", "💋", "💌", "💘", "💝", "💖",
]

export default function EmojiPickerPage() {
  const tool = getToolByPath("/emoji-picker")
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

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><Card>
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
