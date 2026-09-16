import { Suspense } from "react";

import { AcceptInvitationForm } from "./accept-invitation-form";

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading invitation…
        </div>
      }
    >
      <AcceptInvitationForm />
    </Suspense>
  );
}
