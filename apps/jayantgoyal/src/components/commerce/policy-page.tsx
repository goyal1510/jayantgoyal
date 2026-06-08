import Link from "next/link"

import { Button } from "@repo/ui/button"

type PolicySection = {
  title: string
  body: string
}

export function PolicyPage({
  eyebrow,
  title,
  description,
  updatedAt,
  sections,
}: {
  eyebrow: string
  title: string
  description: string
  updatedAt: string
  sections: PolicySection[]
}) {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-sm font-medium uppercase tracking-wide text-zinc-500">{eyebrow}</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-600">{description}</p>
          <p className="mt-4 text-sm text-zinc-500">Last updated: {updatedAt}</p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {sections.map((section) => (
            <article key={section.title} className="rounded-lg border bg-white p-5">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{section.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/store">Back to store</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/#contact">Contact Jayant</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
