import { notFound } from "next/navigation";

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

  return <PublicBoardView slug={slug} projection={payload.projection} />;
}
