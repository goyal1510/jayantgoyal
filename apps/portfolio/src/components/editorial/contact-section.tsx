import {
  Facebook,
  Globe2,
  Github,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";

import { ContactForm } from "@/components/editorial/contact-form";
import { EditorialReveal } from "@/components/editorial/editorial-reveal";
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
  headingLevel = "h2",
}: {
  profile: PortfolioProfile;
  content: PortfolioSectionContent;
  headingLevel?: "h1" | "h2";
}) {
  const heading = getCompactSectionHeading(content.eyebrow, content.headline);
  const Heading = headingLevel;

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
              <a href={`mailto:${profile.email}`}>
                <Mail aria-hidden="true" />
                <span>
                  <small>Email</small>
                  {profile.email}
                </span>
              </a>
              <a href={`tel:${profile.phone.replaceAll(" ", "")}`}>
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
            <ContactForm />
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
            <a href={`mailto:${profile.email}`} aria-label="Email">
              <Mail aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
