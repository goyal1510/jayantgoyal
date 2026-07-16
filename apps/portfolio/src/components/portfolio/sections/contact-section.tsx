"use client";

import Link from "next/link";
import { Code2, Mail, MapPin, Phone } from "lucide-react";
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
import { getIconComponent } from "@/lib/portfolio/icons";
import type { SerializablePortfolioData } from "@/lib/portfolio/serializable";
import { ContactForm } from "@/components/portfolio/contact-form";
import {
  sectionId,
  sectionScrollMargin,
  SectionHeader,
} from "@/components/portfolio/shared";

export function ContactSection({
  contact,
}: {
  contact: SerializablePortfolioData["CONTACT"];
}) {
  return (
    <section
      id={sectionId("contact")}
      className={cn("px-4 sm:px-6 lg:px-8", sectionScrollMargin)}
    >
      <SectionHeader
        title="Get In Touch"
        description="Open to opportunities, collaborations, and interesting problems to solve."
      />
      <Separator className="my-8" />
      <div className="grid gap-10 lg:grid-cols-2 items-stretch">
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Let&apos;s Connect</CardTitle>
              <CardDescription>
                Reach out anytime. I typically respond within a business day.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ContactItem
                icon={Mail}
                label="Email"
                value={contact.email}
                href={`mailto:${contact.email}`}
              />
              <ContactItem
                icon={Phone}
                label="Phone"
                value={contact.phone}
                href={`tel:${contact.phone}`}
              />
              <ContactItem
                icon={MapPin}
                label="Location"
                value={contact.location}
                href={`https://maps.google.com/?q=${encodeURIComponent(contact.location)}`}
              />
              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
                {contact.socials.map((social) => {
                  const SocialIcon = getIconComponent(social.icon_key) ?? Code2;
                  return (
                    <Button
                      key={social.label}
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex h-16 w-full flex-col items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-center"
                    >
                      <Link href={social.href} target="_blank" rel="noreferrer">
                        <SocialIcon className={cn("size-5", social.color)} />
                        <span className="text-xs font-medium">
                          {social.label}
                        </span>
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Send a quick note</CardTitle>
            <CardDescription>
              I will reply via email as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2 transition hover:-translate-y-0.5 hover:shadow-sm my-2">
      <Icon className="size-5 text-primary" />
      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} target="_blank" rel="noreferrer">
        {content}
      </Link>
    );
  }

  return content;
}
