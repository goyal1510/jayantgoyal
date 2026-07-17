import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import EmojiPickerClient from "./client"

const tool = getToolByPath("/tools/other/emoji-picker")

export const metadata: Metadata = buildToolPageMetadata("/tools/other/emoji-picker")

export default function EmojiPickerPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <EmojiPickerClient />
}
