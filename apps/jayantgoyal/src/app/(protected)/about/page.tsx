import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BriefcaseBusiness, Code2, GraduationCap, MapPin } from "lucide-react"

import { Badge } from "@repo/ui/badge"
import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"

import { BreadcrumbJsonLd, ProfilePageJsonLd } from "@/components/seo/json-ld"
import { buildPublicPageMetadata, PERSON_NAME, SITE_URL } from "@/lib/seo/config"
import { getPortfolioDataFromHeaders } from "@/lib/portfolio/server"

export const metadata: Metadata = buildPublicPageMetadata({
  title: `${PERSON_NAME} - Full-Stack Developer Profile`,
  description:
    "Learn about Jayant Goyal, a full-stack developer building portfolio projects, developer tools, games, and utilities with Next.js, React, TypeScript, and Supabase.",
  pathname: "/about",
})

export default async function AboutPage() {
  const { data } = await getPortfolioDataFromHeaders()
  const primarySkills = data.SKILL_SETS.flatMap((set) => set.items.map((item) => item.name)).slice(0, 14)
  const featuredProjects = data.PROJECTS.slice(0, 3)

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <ProfilePageJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: SITE_URL },
          { name: "About Jayant Goyal", url: `${SITE_URL}/about` },
        ]}
      />

      <section className="space-y-5">
        <div className="space-y-3">
          <p className="text-sm font-medium text-primary">Full-stack developer profile</p>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-normal sm:text-4xl">
            Jayant Goyal builds practical web apps, developer tools, and portfolio products.
          </h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            {data.ABOUT.summary ||
              "Jayant Goyal is a full-stack developer focused on Next.js, React, TypeScript, and Supabase applications."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/#projects">
              View projects <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/tools">Explore developer tools</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/blogs">Read blog posts</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4 text-primary" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{data.HERO.location}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BriefcaseBusiness className="size-4 text-primary" />
              Focus
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{data.HERO.role}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Code2 className="size-4 text-primary" />
              Public work
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Portfolio, 99+ developer tools, games, utilities, and GitHub stats.
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>What Jayant Goyal works on</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Jayant Goyal works across frontend, backend, and product-focused web experiences. The
              portfolio combines personal work with usable public tools so visitors can inspect both
              the engineering stack and the shipped product surface.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              {data.ABOUT.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.EDUCATION.map((education) => (
              <div key={`${education.school}-${education.period}`} className="space-y-1">
                <p className="text-sm font-medium">{education.degree}</p>
                <p className="text-sm text-muted-foreground">{education.school}</p>
                <p className="text-xs text-primary">{education.period}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Skills and stack</h2>
        <div className="flex flex-wrap gap-2">
          {primarySkills.map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Featured projects</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/#projects">All projects</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featuredProjects.map((project) => (
            <Card key={project.name}>
              <CardHeader>
                <CardTitle className="text-base">{project.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{project.shortDescription}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
