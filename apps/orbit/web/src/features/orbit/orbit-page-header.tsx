import type { ReactNode } from "react";

type OrbitPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function OrbitPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: OrbitPageHeaderProps) {
  return (
    <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-background to-background p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          {eyebrow ? (
            <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
