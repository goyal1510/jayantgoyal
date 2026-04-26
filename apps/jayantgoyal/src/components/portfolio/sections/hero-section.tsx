'use client';

import { m } from "framer-motion";
import {
  Database,
  Download,
  FileCode2,
  Mail,
  Sparkles,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import FlipText from "@/components/ui/flip-text";
import Typewriter from "@/components/ui/typewriter";
import { cn } from "@repo/ui/lib/utils";
import type { PortfolioDataSource } from "@/lib/portfolio/use-portfolio-data";
import type { SerializablePortfolioData } from "@/lib/portfolio/serializable";
import { sectionId, sectionScrollMargin } from "@/components/portfolio/shared";

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
      {/* No animation wrapper on the main container — render immediately for fast LCP */}
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
        {/* LCP element — no opacity:0, no animation delay. Renders instantly. */}
        <div className="space-y-3">
          <h1 className="flex items-center justify-center gap-[0.3em] flex-wrap text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl uppercase tracking-wide leading-[1.2]">
            <span>HI, I&apos;M</span>
            <FlipText className={source === "database" ? "text-cyan-500" : "text-amber-500"} duration={3}>{hero.name.toUpperCase()}</FlipText>
          </h1>
          <p className="text-2xl text-muted-foreground uppercase tracking-wider">
            <Typewriter text={hero.role.toUpperCase()} speed={80} delay={500} cursor={true} />
          </p>
        </div>
        {/* Only animate the CTA buttons — they're below fold on mobile */}
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Button size="lg" className="group h-11" onClick={() => {
            const contactSection = document.getElementById(sectionId("contact"));
            contactSection?.scrollIntoView({ behavior: "smooth" });
          }}>
            Get in touch
            <Mail className="ml-2 size-4 transition-transform group-hover:translate-y-0.5" />
          </Button>
          <Button asChild size="lg" variant="outline" className="group h-11">
            <a href="/assets/Jayant_Resume.pdf" download="Jayant_Resume.pdf">
              Download CV
              <Download className="ml-2 size-4 transition-transform group-hover:translate-y-0.5" />
            </a>
          </Button>
        </m.div>
      </div>
    </section>
  );
}
