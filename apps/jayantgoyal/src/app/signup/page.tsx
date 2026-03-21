import type { Metadata } from "next"
import { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";
import { CircularLoader } from "@/components/ui/circular-loader";

export const metadata: Metadata = {
  title: "Sign Up | Jayant",
  description: "Create a new account.",
}

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-md">
        <Suspense fallback={<CircularLoader />}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  )
}
