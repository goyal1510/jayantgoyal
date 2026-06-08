import Link from "next/link"

const links = [
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/refund-policy", label: "Refunds" },
  { href: "/contact-policy", label: "Contact" },
  { href: "/terms-conditions", label: "Terms" },
]

export function CommercePolicyLinks({ className = "" }: { className?: string }) {
  return (
    <nav
      aria-label="Commerce policies"
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground ${className}`}
    >
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="underline-offset-4 hover:underline">
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
