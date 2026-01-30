"use client"

import Image from "next/image"
import { MapPin, Building2, Link as LinkIcon, Users, BookOpen } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import type { GitHubUser } from "@/lib/github-stats/types"

interface ProfileCardProps {
  user: GitHubUser
}

export function ProfileCard({ user }: ProfileCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card>
        <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start">
          <Image
            src={user.avatar_url}
            alt={user.login}
            width={120}
            height={120}
            className="rounded-full border-2 border-border"
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="mb-1">
              <a
                href={user.html_url}
                target="_blank"
                rel="noreferrer"
                className="text-2xl font-bold hover:underline"
              >
                {user.name ?? user.login}
              </a>
              <span className="ml-2 text-muted-foreground">@{user.login}</span>
            </div>
            {user.bio && <p className="mb-3 text-muted-foreground">{user.bio}</p>}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:justify-start">
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-4" />
                  {user.location}
                </span>
              )}
              {user.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="size-4" />
                  {user.company}
                </span>
              )}
              {user.blog && (
                <a
                  href={user.blog.startsWith("http") ? user.blog : `https://${user.blog}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <LinkIcon className="size-4" />
                  Website
                </a>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm sm:justify-start">
              <span className="flex items-center gap-1">
                <Users className="size-4" />
                <strong>{user.followers}</strong> followers
              </span>
              <span className="flex items-center gap-1">
                <strong>{user.following}</strong> following
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="size-4" />
                <strong>{user.public_repos}</strong> repos
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
