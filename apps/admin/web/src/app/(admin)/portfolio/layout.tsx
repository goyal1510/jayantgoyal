import { checkCapability } from "@jayantgoyal/web-auth/authorization";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function PortfolioAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const mutationAccess = await checkCapability(
    supabase,
    "portfolio.content.update",
  );

  return (
    <div className="space-y-4">
      {!mutationAccess.allowed && (
        <div
          role="status"
          className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
        >
          Read-only access: you can inspect Portfolio content, but changes and
          uploads require full access.
        </div>
      )}
      <fieldset
        disabled={!mutationAccess.allowed}
        className="min-w-0 border-0 p-0 disabled:opacity-90"
      >
        {children}
      </fieldset>
    </div>
  );
}
