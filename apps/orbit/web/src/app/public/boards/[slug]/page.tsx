import Link from "next/link";
import { notFound } from "next/navigation";
import { Orbit as OrbitIcon } from "lucide-react";

import { PublicBoardView } from "@/features/boards/public-board-view";
import { getPublishedBoardProjection } from "@/server/queries/p2";

type PublicBoardPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PublicBoardPage({ params }: PublicBoardPageProps) {
  const { slug } = await params;
  const payload = (await getPublishedBoardProjection(slug)) as {
    projection?: Parameters<typeof PublicBoardView>[0]["projection"];
  } | null;
  if (!payload?.projection) notFound();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-muted/20">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <OrbitIcon className="h-4 w-4 text-primary" aria-hidden />
            Orbit public board
          </div>
          <Link href="/welcome" className="text-sm text-primary underline">
            Sign in to Orbit
          </Link>
        </div>
      </header>
      <PublicBoardView slug={slug} projection={payload.projection} />
    </div>
  );
}
