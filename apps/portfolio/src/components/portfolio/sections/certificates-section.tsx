"use client";

import dynamic from "next/dynamic";
import { m } from "framer-motion";
import { useState } from "react";
import { Award, Link2 } from "lucide-react";
import { Button } from "@repo/ui/button";
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
import {
  sectionId,
  sectionScrollMargin,
  SectionHeader,
  Badge,
  type Certificate,
} from "@/components/portfolio/shared";

const PDFViewerModal = dynamic(
  () =>
    import("@/components/portfolio/pdf-viewer").then(
      (mod) => mod.PDFViewerModal,
    ),
  { ssr: false },
);

export function CertificatesSection({
  categories,
  selectedCategory,
  certificates,
  onSelectCategory,
}: {
  categories: string[];
  selectedCategory: string;
  certificates: SerializablePortfolioData["CERTIFICATES"];
  onSelectCategory: (category: string) => void;
}) {
  const [openCertificate, setOpenCertificate] = useState<Certificate | null>(
    null,
  );

  const filteredCertificates =
    selectedCategory === "All"
      ? certificates
      : certificates.filter((cert) => cert.category === selectedCategory);

  return (
    <section
      id={sectionId("certificates")}
      className={cn("px-4 sm:px-6 lg:px-8", sectionScrollMargin)}
    >
      <SectionHeader
        title="My Certificates"
        description="Credentials and achievements that back up the hands-on work."
      />
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {categories.map((category) => (
          <Button
            key={category}
            size="sm"
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => onSelectCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>
      <Separator className="my-8" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCertificates.map((cert, index) => (
          <m.div
            key={cert.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.05 }}
            viewport={{ once: true }}
          >
            <Card className="flex h-full flex-col transition hover:-translate-y-1 hover:shadow-lg">
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <Award className="size-4 text-primary" />
                  <CardTitle className="text-base">{cert.name}</CardTitle>
                </div>
                <CardDescription>{cert.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-between">
                <Badge variant="secondary">{cert.category}</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenCertificate(cert)}
                >
                  <Link2 className="mr-2 size-4" />
                  View
                </Button>
              </CardContent>
            </Card>
          </m.div>
        ))}
      </div>
      {openCertificate ? (
        <PDFViewerModal
          name={openCertificate.name}
          issuer={openCertificate.issuer}
          description={openCertificate.description}
          path={openCertificate.path}
          onClose={() => setOpenCertificate(null)}
        />
      ) : null}
    </section>
  );
}
