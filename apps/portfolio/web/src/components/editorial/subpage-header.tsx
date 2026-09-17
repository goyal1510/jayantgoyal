import { ArrowDown } from "lucide-react";
import Link from "next/link";

import { PortfolioNavigation } from "@/components/editorial/portfolio-navigation";
import type {
  PortfolioNavigationItem,
  PortfolioSectionContent,
} from "@/lib/portfolio/editorial-data";

export function EditorialSubpageHeader({
  brandLabel,
  navigation,
  contact,
}: {
  brandLabel: string;
  navigation: PortfolioNavigationItem[];
  contact?: PortfolioSectionContent;
}) {
  return (
    <header className="editorial-subpage-header">
      <div className="shell editorial-subpage-header__inner">
        <Link href="/" className="monogram" aria-label="Portfolio home">
          {brandLabel}
        </Link>
        <PortfolioNavigation
          surface="subpage"
          ariaLabel="Portfolio navigation"
          items={navigation}
          contact={contact}
        />
        <Link
          className="editorial-subpage-header__contact"
          href="/contact"
          data-analytics-event="contact_intent"
          data-analytics-source="subpage_header"
          data-analytics-destination="contact_form"
        >
          {contact?.accent || contact?.supportingText || "Get in touch"}{" "}
          <ArrowDown aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
