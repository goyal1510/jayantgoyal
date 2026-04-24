'use client';

import { GraduationCap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Separator } from "@repo/ui/separator";
import { cn } from "@repo/ui/lib/utils";
import type { SerializablePortfolioData } from "@/lib/portfolio/serializable";
import { sectionId, sectionScrollMargin, SectionHeader } from "@/components/portfolio/shared";

export function AboutSection({
  about,
  education,
}: {
  about: SerializablePortfolioData["ABOUT"];
  education: SerializablePortfolioData["EDUCATION"];
}) {
  return (
    <section
      id={sectionId("about")}
      className={cn("px-4 sm:px-6 lg:px-8", sectionScrollMargin)}
    >
      <SectionHeader
        title="About Me"
        description="Get to know me better—my journey, passion, and what drives me to create."
      />
      <div className="mt-10">
        <Card>
          <CardHeader>
            <CardTitle>Career Objective</CardTitle>
            <CardDescription>
              Where I focus and how I like to work.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Aspiring Full Stack Developer skilled in Next.js, React.js, JavaScript, TypeScript and Supabase. Passionate about building innovative
              solutions and collaborating with teams to ship meaningful
              experiences.
            </p>
            <div className="space-y-2">
              {about.highlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
                >
                  <span className="size-2 rounded-full bg-primary" />
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-10" />

      <div className="space-y-6">
        <div className="flex items-center justify-center gap-2">
          <GraduationCap className="size-5 text-primary" />
          <h4 className="text-xl font-semibold">Education Journey</h4>
        </div>
        <div className="relative">
          <div className="absolute left-0 right-0 top-8 h-px bg-border" />
          <div className="relative flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-6">
            {education.map((edu) => (
              <div
                key={`${edu.school}-${edu.period}`}
                className="relative flex-1 text-center"
              >
                <div className="mx-auto flex size-16 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg">
                  <span className="text-sm font-semibold">{edu.period}</span>
                </div>
                <div className="mt-4 space-y-1 rounded-lg border bg-card p-4 shadow-sm">
                  <p className="text-sm font-semibold">{edu.degree}</p>
                  <p className="text-xs text-muted-foreground">{edu.school}</p>
                  <p className="text-xs text-primary font-medium">
                    {edu.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
