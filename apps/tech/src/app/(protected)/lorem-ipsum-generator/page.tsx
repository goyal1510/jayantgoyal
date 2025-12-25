"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

const loremWords = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum"
]

function generateLoremIpsum(paragraphs: number, sentencesPerParagraph: number): string {
  const result: string[] = []
  
  for (let p = 0; p < paragraphs; p++) {
    const sentences: string[] = []
    
    for (let s = 0; s < sentencesPerParagraph; s++) {
      const words: string[] = []
      const wordCount = Math.floor(Math.random() * 15) + 8
      
      for (let w = 0; w < wordCount; w++) {
        const randomWord = loremWords[Math.floor(Math.random() * loremWords.length)] ?? "lorem"
        if (w === 0) {
          words.push(randomWord.charAt(0).toUpperCase() + randomWord.slice(1))
        } else {
          words.push(randomWord)
        }
      }
      
      sentences.push(words.join(" ") + ".")
    }
    
    result.push(sentences.join(" "))
  }
  
  return result.join("\n\n")
}

export default function LoremIpsumGeneratorPage() {
  const tool = getToolByPath("/lorem-ipsum-generator")
  const [paragraphs, setParagraphs] = React.useState(3)
  const [sentencesPerParagraph, setSentencesPerParagraph] = React.useState(3)
  const [text, setText] = React.useState("")

  const generate = React.useCallback(() => {
    const generated = generateLoremIpsum(paragraphs, sentencesPerParagraph)
    setText(generated)
  }, [paragraphs, sentencesPerParagraph])

  React.useEffect(() => {
    generate()
  }, [generate])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text)
    toast.success("Lorem ipsum copied to clipboard")
  }

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
            <CardDescription>Configure generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paragraphs">Number of Paragraphs</Label>
              <Input
                id="paragraphs"
                type="number"
                min="1"
                max="20"
                value={paragraphs}
                onChange={(e) => setParagraphs(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sentences">Sentences per Paragraph</Label>
              <Input
                id="sentences"
                type="number"
                min="1"
                max="10"
                value={sentencesPerParagraph}
                onChange={(e) => setSentencesPerParagraph(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              />
            </div>

            <Button onClick={generate} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Text</CardTitle>
                <CardDescription>Lorem ipsum placeholder text</CardDescription>
              </div>
              {text && (
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={text}
              readOnly
              className="w-full min-h-[400px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
