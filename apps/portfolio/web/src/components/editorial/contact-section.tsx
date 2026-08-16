import {
  Facebook,
  Globe2,
  Github,
  Instagram,
  Linkedin,
  MapPin,
  Phone,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";

import { ContactForm } from "@/components/editorial/contact-form";
import { EditorialReveal } from "@/components/editorial/editorial-reveal";
import { HydratedEmailLink } from "@/components/editorial/hydrated-email-link";
import type { ContactContext } from "@/lib/contact/context";
import type {
  PortfolioProfile,
  PortfolioSectionContent,
  PortfolioSocialLink,
} from "@/lib/portfolio/editorial-data";
import { getCompactSectionHeading } from "@/lib/portfolio/section-heading";

const SOCIAL_ICON_MAP: Record<string, LucideIcon> = {
  facebook: Facebook,
  github: Github,
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
};

function SocialIcon({ social }: { social: PortfolioSocialLink }) {
  const identity = `${social.iconKey} ${social.label}`.toLowerCase();
  const key = Object.keys(SOCIAL_ICON_MAP).find((candidate) =>
    identity.includes(candidate),
  );
  const Icon = key ? SOCIAL_ICON_MAP[key] : Globe2;
  return Icon ? <Icon aria-hidden="true" /> : null;
}

export function ContactSection({
  profile,
  content,
  contactContext = { leadSource: "direct" },
  headingLevel = "h2",
}: {
  profile: PortfolioProfile;
  content: PortfolioSectionContent;
  contactContext?: ContactContext;
  headingLevel?: "h1" | "h2";
}) {
  const heading = getCompactSectionHeading(content.eyebrow, content.headline);
  const Heading = headingLevel;
  const emailCodePoints = Array.from(profile.email, (character) =>
    character.codePointAt(0),
  ).filter((codePoint): codePoint is number => codePoint !== undefined);

  return (
    <footer id="contact" className="contact-section">
      <div className="shell">
        <EditorialReveal className="section-heading section-heading--contact">
          <span className="section-index">{heading.label}</span>
          <div>
            <Heading>{heading.title}</Heading>
            <p>{content.description}</p>
          </div>
        </EditorialReveal>

        <div className="contact-section__grid">
          <EditorialReveal className="contact-section__copy">
            <div className="contact-details">
              <HydratedEmailLink
                emailCodePoints={emailCodePoints}
                variant="detail"
              />
              <a
                href={`tel:${profile.phone.replaceAll(" ", "")}`}
                data-analytics-event="contact_intent"
                data-analytics-source="contact_page"
                data-analytics-destination="phone"
              >
                <Phone aria-hidden="true" />
                <span>
                  <small>Phone</small>
                  {profile.phone}
                </span>
              </a>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(profile.location)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin aria-hidden="true" />
                <span>
                  <small>Location</small>
                  {profile.location}
                </span>
              </a>
            </div>
          </EditorialReveal>

          <EditorialReveal className="contact-form-paper">
            <div className="contact-form-paper__heading">
              <span>New message</span>
              <p>{content.supportingText}</p>
            </div>
            <ContactForm
              initialProject={contactContext.initialProject}
              leadSource={contactContext.leadSource}
            />
          </EditorialReveal>
        </div>

        <div className="contact-section__footer">
          <span>
            {profile.name} © {new Date().getFullYear()}
          </span>
          <span>{profile.location}</span>
          <div>
            {profile.socials.map((social) => (
              <a
                key={`${social.label}-${social.href}`}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
              >
                <SocialIcon social={social} />
              </a>
            ))}
            <HydratedEmailLink
              emailCodePoints={emailCodePoints}
              variant="icon"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
