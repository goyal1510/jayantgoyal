"use client";

import Image from "next/image";
import {
  MapPin,
  Building2,
  Link as LinkIcon,
  Users,
  BookOpen,
} from "lucide-react";
import { m } from "framer-motion";
import { Card, CardContent } from "@repo/ui/card";
import type { GitHubUser } from "@/lib/github-stats/types";

interface ProfileCardProps {
  user: GitHubUser;
}

export function ProfileCard({ user }: ProfileCardProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="rounded-[1.75rem] border-border/80 bg-card shadow-none">
        <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center sm:p-7">
          <Image
            src={user.avatar_url}
            alt={user.login}
            width={120}
            height={120}
            className="rounded-3xl border border-border/80"
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="mb-2 flex flex-wrap items-baseline justify-center gap-x-2 sm:justify-start">
              <a
                href={user.html_url}
                target="_blank"
                rel="noreferrer"
                className="text-3xl font-semibold tracking-[-0.04em] hover:underline"
              >
                {user.name ?? user.login}
              </a>
              <span className="font-[family-name:var(--font-ibm-plex-mono)] text-xs text-muted-foreground">
                @{user.login}
              </span>
            </div>
            {user.bio && (
              <p className="mb-3 text-muted-foreground">{user.bio}</p>
            )}
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
                  href={
                    user.blog.startsWith("http")
                      ? user.blog
                      : `https://${user.blog}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <LinkIcon className="size-4" />
                  Website
                </a>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border/70 pt-4 text-sm sm:justify-start">
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
    </m.div>
  );
}
