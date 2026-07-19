import { EditorialButton } from "@/components/editorial/editorial-button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold tracking-[0.2em] text-primary uppercase">
        404
      </p>
      <h1 className="mt-3 text-3xl font-bold">This page is not here</h1>
      <p className="mt-3 text-muted-foreground">
        The link may be outdated, or the content may have moved during the
        platform restructure.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <EditorialButton href="/">Return to Portfolio</EditorialButton>
        <EditorialButton href="/blog">Read the blog</EditorialButton>
      </div>
    </div>
  );
}
