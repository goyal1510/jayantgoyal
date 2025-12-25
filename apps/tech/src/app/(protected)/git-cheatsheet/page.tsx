"use client"

import * as React from "react"
import { getToolByPath } from "@/lib/tools"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const gitCommands = [
  {
    category: "Basic Commands",
    commands: [
      { cmd: "git init", desc: "Initialize a new Git repository" },
      { cmd: "git clone <url>", desc: "Clone a repository" },
      { cmd: "git status", desc: "Check status of working directory" },
      { cmd: "git add <file>", desc: "Stage a file" },
      { cmd: "git add .", desc: "Stage all changes" },
      { cmd: "git commit -m \"message\"", desc: "Commit staged changes" },
      { cmd: "git log", desc: "View commit history" },
      { cmd: "git diff", desc: "Show changes" },
    ],
  },
  {
    category: "Branching",
    commands: [
      { cmd: "git branch", desc: "List branches" },
      { cmd: "git branch <name>", desc: "Create a new branch" },
      { cmd: "git checkout <branch>", desc: "Switch to branch" },
      { cmd: "git checkout -b <branch>", desc: "Create and switch to branch" },
      { cmd: "git merge <branch>", desc: "Merge branch into current" },
      { cmd: "git branch -d <branch>", desc: "Delete branch" },
    ],
  },
  {
    category: "Remote",
    commands: [
      { cmd: "git remote -v", desc: "List remotes" },
      { cmd: "git remote add <name> <url>", desc: "Add remote" },
      { cmd: "git push <remote> <branch>", desc: "Push to remote" },
      { cmd: "git pull <remote> <branch>", desc: "Pull from remote" },
      { cmd: "git fetch", desc: "Fetch from remote" },
    ],
  },
  {
    category: "Undo",
    commands: [
      { cmd: "git reset HEAD <file>", desc: "Unstage file" },
      { cmd: "git checkout -- <file>", desc: "Discard changes" },
      { cmd: "git revert <commit>", desc: "Revert a commit" },
      { cmd: "git reset --soft HEAD~1", desc: "Undo last commit, keep changes" },
      { cmd: "git reset --hard HEAD~1", desc: "Undo last commit, discard changes" },
    ],
  },
]

export default function GitCheatsheetPage() {
  const tool = getToolByPath("/git-cheatsheet")

  if (!tool) {
    return <div>Tool not found</div>
  }
return (
    <div className="space-y-6"><div className="grid gap-6 md:grid-cols-2">
        {gitCommands.map((section) => (
          <Card key={section.category}>
            <CardHeader>
              <CardTitle>{section.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {section.commands.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <code className="block font-mono text-sm bg-muted px-2 py-1 rounded">
                      {item.cmd}
                    </code>
                    <p className="text-sm text-muted-foreground ml-2">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
