import type { Metadata } from "next"
import { Suspense } from "react";
import { WelcomeForm } from "@/components/auth/welcome-form";
import { CircularLoader } from "@/components/ui/circular-loader";

export const metadata: Metadata = {
  title: "Welcome | Jayant",
  description: "Sign in or create your account.",
}

export default function WelcomePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-md">
        <Suspense fallback={<CircularLoader />}>
          <WelcomeForm />
        </Suspense>
      </div>
    </div>
  )
}
