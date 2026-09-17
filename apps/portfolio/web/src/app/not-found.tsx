import { EditorialButton } from "@/components/editorial/editorial-button";
import { getPortfolioShellData } from "@/lib/portfolio/editorial-server";

export default async function NotFound() {
  const { sectionContent } = await getPortfolioShellData();
  const content = sectionContent.studio;

  return (
    <div className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold tracking-[0.2em] text-primary uppercase">
        {content.eyebrow || "404"}
      </p>
      <h1 className="mt-3 text-3xl font-bold">{content.headline}</h1>
      <p className="mt-3 text-muted-foreground">{content.description}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <EditorialButton href="/">{content.accent}</EditorialButton>
        <EditorialButton href="/writing">
          {content.supportingText}
        </EditorialButton>
      </div>
    </div>
  );
}
