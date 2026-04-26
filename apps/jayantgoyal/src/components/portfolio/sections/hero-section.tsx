import {
  Database,
  Download,
  FileCode2,
  Sparkles,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/lib/utils";
import type { PortfolioDataSource } from "@/lib/portfolio/use-portfolio-data";
import type { SerializablePortfolioData } from "@/lib/portfolio/serializable";
import { sectionId, sectionScrollMargin } from "@/components/portfolio/constants";
import { HeroCta } from "@/components/portfolio/sections/hero-cta";
import FlipText from "@/components/ui/flip-text";

export function HeroSection({
  hero,
  source,
}: {
  hero: SerializablePortfolioData["HERO"];
  source: PortfolioDataSource;
}) {
  return (
    <section
      id={sectionId("home")}
      className={cn("px-4 sm:px-6 lg:px-8", sectionScrollMargin)}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 py-16 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="size-4" />
            Welcome to my portfolio
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            {source === "database" ? <Database className="size-4" /> : <FileCode2 className="size-4" />}
            {source === "database" ? "Database" : "System"}
          </span>
        </div>
        {/* LCP element — pure server HTML, no JS dependency */}
        <div className="space-y-3">
          <h1 className="flex items-center justify-center gap-[0.3em] flex-wrap text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl uppercase tracking-wide leading-[1.2]">
            <span>HI, I&apos;M</span>
            <FlipText className={source === "database" ? "text-cyan-500" : "text-amber-500"} duration={3}>{hero.name.toUpperCase()}</FlipText>
          </h1>
          <p className="text-2xl text-muted-foreground uppercase tracking-wider">
            {hero.role.toUpperCase()}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <HeroCta />
          <Button asChild size="lg" variant="outline" className="group h-11">
            <a href="/assets/Jayant_Resume.pdf" download="Jayant_Resume.pdf">
              Download CV
              <Download className="ml-2 size-4 transition-transform group-hover:translate-y-0.5" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
