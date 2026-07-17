import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

import { getToolByPath } from "@/lib/tools/tools";
import { toolSeoContentByPath } from "@/lib/tools/seo-content";

type ToolSeoContentProps = {
  pathname: string;
  baseUrl: string;
};

export function ToolSeoContent({ pathname, baseUrl }: ToolSeoContentProps) {
  const tool = getToolByPath(pathname);
  const content = toolSeoContentByPath[pathname];

  if (!tool || !content) return null;

  const faqJsonLd = content.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: content.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }
    : null;

  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.title,
    url: `${baseUrl}${tool.path}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description: tool.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <section className="space-y-4" aria-labelledby="tool-reference-heading">
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />
      <Card>
        <CardHeader>
          <CardTitle id="tool-reference-heading" className="text-lg">
            {tool.title} reference
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm leading-6 text-muted-foreground">
          <p>{content.summary}</p>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">
                Common uses
              </h2>
              <ul className="list-disc space-y-1 pl-5">
                {content.useCases.map((useCase) => (
                  <li key={useCase}>{useCase}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-semibold text-foreground">
                Examples
              </h2>
              <ul className="list-disc space-y-1 pl-5">
                {content.examples.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
            <h2 className="text-base font-semibold text-foreground">
              Keep in mind
            </h2>
            <p className="mt-1">{content.considerations}</p>
          </div>

          {content.faqs?.length ? (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">FAQ</h2>
              <div className="grid gap-3">
                {content.faqs.map((faq) => (
                  <div
                    key={faq.question}
                    className="rounded-md border bg-muted/20 p-3"
                  >
                    <h3 className="font-medium text-foreground">
                      {faq.question}
                    </h3>
                    <p className="mt-1">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
