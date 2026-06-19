'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Separator } from "@repo/ui/separator";
import { cn } from "@repo/ui/lib/utils";
import LogoSlider from "@/components/ui/logo-slider";
import { BrandSkillIcon } from "@/components/portfolio/brand-skill-icon";
import type { SerializablePortfolioData } from "@/lib/portfolio/serializable";
import {
  sectionId,
  sectionScrollMargin,
  SectionHeader,
  Progress,
} from "@/components/portfolio/shared";

export function SkillsSection({
  skillSets,
  techIcons,
}: {
  skillSets: SerializablePortfolioData["SKILL_SETS"];
  techIcons: SerializablePortfolioData["TECH_ICONS"];
}) {
  return (
    <section
      id={sectionId("skills")}
      className={cn("px-4 sm:px-6 lg:px-8", sectionScrollMargin)}
    >
      <SectionHeader
        title="Skills & Technologies"
        description="The tools and stacks I reach for to ship reliable, user-friendly products."
      />

      <div className="mt-10 overflow-hidden rounded-2xl bg-muted/30 py-6 max-w-5xl mx-auto">
        <LogoSlider
          logos={techIcons.map((tech) => (
            <div
              key={tech.name}
              className="flex items-center justify-center gap-3 px-4 py-2"
            >
              <BrandSkillIcon
                name={tech.name}
                iconKey={tech.icon_key}
                className="size-8"
              />
              <span className="text-lg font-medium text-foreground whitespace-nowrap">
                {tech.name}
              </span>
            </div>
          ))}
          speed={30}
          direction="left"
          pauseOnHover={true}
          blurLayers={4}
        />
      </div>

      <Separator className="my-10" />

      <div className="grid gap-6 md:grid-cols-2">
        {skillSets.map((set, setIndex) => (
          <div
            key={set.title}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{
              animationDelay: `${setIndex * 50}ms`,
              animationFillMode: "both",
            }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{set.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {set.items.map((item, itemIndex) => (
                  <div
                    key={item.name}
                    className="space-y-2 animate-in fade-in slide-in-from-left-3 duration-300"
                    style={{
                      animationDelay: `${itemIndex * 50}ms`,
                      animationFillMode: "both",
                    }}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex min-w-0 items-center gap-2.5 font-medium">
                        <BrandSkillIcon
                          name={item.name}
                          iconKey={item.icon_key}
                          className="size-4"
                        />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="text-muted-foreground">
                        {item.level}%
                      </span>
                    </div>
                    <Progress value={item.level} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </section>
  );
}
