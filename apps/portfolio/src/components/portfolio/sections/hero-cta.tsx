"use client";

import { Mail } from "lucide-react";
import { Button } from "@repo/ui/button";
import { sectionId } from "@/components/portfolio/shared";

export function HeroCta() {
  return (
    <Button
      size="lg"
      className="group h-11"
      onClick={() => {
        document
          .getElementById(sectionId("contact"))
          ?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      Get in touch
      <Mail className="ml-2 size-4 transition-transform group-hover:translate-y-0.5" />
    </Button>
  );
}
