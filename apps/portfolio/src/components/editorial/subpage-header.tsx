import { ArrowDown } from "lucide-react";
import Link from "next/link";

import { PERSON_BRAND } from "@repo/brand";

import { PortfolioNavigation } from "@/components/editorial/portfolio-navigation";

export function EditorialSubpageHeader() {
  return (
    <header className="editorial-subpage-header">
      <div className="shell editorial-subpage-header__inner">
        <Link href="/" className="monogram" aria-label="Portfolio home">
          {PERSON_BRAND.monogram}
        </Link>
        <PortfolioNavigation
          surface="subpage"
          ariaLabel="Portfolio navigation"
        />
        <Link className="editorial-subpage-header__contact" href="/#contact">
          Let&apos;s talk <ArrowDown aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
