"use client";

import { m } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Separator } from "@repo/ui/separator";
import { cn } from "@repo/ui/lib/utils";
import type { SerializablePortfolioData } from "@/lib/portfolio/serializable";
import {
  sectionId,
  sectionScrollMargin,
  SectionHeader,
  InfoPill,
} from "@/components/portfolio/shared";

export function ExperienceSection({
  experience,
}: {
  experience: SerializablePortfolioData["EXPERIENCE"];
}) {
  return (
    <section
      id={sectionId("experience")}
      className={cn("px-4 sm:px-6 lg:px-8", sectionScrollMargin)}
    >
      <SectionHeader
        title="Work Experience"
        description="Recent roles, responsibilities, and the outcomes delivered."
      />
      <Separator className="my-8" />
      <div className="space-y-6">
        {experience.map((exp, index) => (
          <m.div
            key={`${exp.company}-${exp.role}`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.05 }}
            viewport={{ once: true }}
          >
            <Card className="relative">
              {index < experience.length - 1 ? (
                <div className="absolute left-6 top-full h-8 w-px bg-border" />
              ) : null}
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{exp.role}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {exp.company}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <InfoPill icon={Calendar} label={exp.period} />
                    <InfoPill icon={MapPin} label={exp.location} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{exp.summary}</p>
                <ul className="space-y-2">
                  {exp.bullets.map((item) => (
                    <li key={item}>
                      <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                        <span className="size-2 rounded-full bg-primary" />
                        <span className="leading-relaxed">{item}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </m.div>
        ))}
      </div>
    </section>
  );
}
