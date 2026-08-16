import type { Metadata } from "next";

import { CircularLoader } from "@jayant/web-ui/circular-loader";

export const metadata: Metadata = { title: "Loader Preview" };

export default function LoaderPreview() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background text-foreground">
      <CircularLoader />
    </div>
  );
}
