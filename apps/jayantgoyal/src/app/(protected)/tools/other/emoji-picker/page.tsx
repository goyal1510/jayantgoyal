import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import EmojiPickerClient from "./client"

const tool = getToolByPath("/tools/other/emoji-picker")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function EmojiPickerPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <EmojiPickerClient />
}
