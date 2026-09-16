import {
  Facebook,
  Globe2,
  Github,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";

import { HydratedEmailLink } from "@/components/editorial/hydrated-email-link";
import type { PortfolioSocialLink } from "@/lib/portfolio/editorial-data";
import { getPortfolioShellData } from "@/lib/portfolio/editorial-server";

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

/** Loads the canonical CMS contact details for the footer shared by all pages. */
export async function PortfolioFooter() {
  const { profile } = await getPortfolioShellData();
  const emailCodePoints = Array.from(profile.email, (character) =>
    character.codePointAt(0),
  ).filter((codePoint): codePoint is number => codePoint !== undefined);

  return (
    <footer className="portfolio-footer" aria-label="Portfolio footer">
      <div className="shell portfolio-footer__inner">
        <span>
          {profile.name} © {new Date().getFullYear()}
        </span>
        <span className="portfolio-footer__location">{profile.location}</span>
        <nav
          className="portfolio-footer__links"
          aria-label="Social and email links"
        >
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
          <HydratedEmailLink emailCodePoints={emailCodePoints} variant="icon" />
        </nav>
      </div>
    </footer>
  );
}
