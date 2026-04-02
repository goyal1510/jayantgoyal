import type { Metadata } from "next";
import { Suspense } from "react";
import SessionLimitClient from "./client";
import { CircularLoader } from "@/components/ui/circular-loader";

export const metadata: Metadata = {
  title: "Session Limit | Jayant",
  description: "Manage your active sessions.",
};

export default function SessionLimitPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-md">
        <Suspense fallback={<CircularLoader />}>
          <SessionLimitClient />
        </Suspense>
      </div>
    </div>
  );
}
