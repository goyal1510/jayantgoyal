import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function EditorialCtaBand({
  id,
  eyebrow,
  title,
  description,
  href,
  actionLabel,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <section id={id} className="shell home-contact-prompt">
      <span className="section-index">{eyebrow}</span>
      <div className="home-contact-prompt__body">
        <h2>{title}</h2>
        <p>{description}</p>
        <Link href={href} className="text-link home-contact-prompt__action">
          {actionLabel} <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
