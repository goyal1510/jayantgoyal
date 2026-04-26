import { cn } from "@repo/ui/lib/utils";

// Re-export from constants so existing imports from "./shared" keep working
export { sectionId, sectionScrollMargin } from "./constants";
export type { SectionId, Project, Certificate } from "./constants";

export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-center gap-4">
        <span className="size-2 rounded-full bg-foreground" />
        <span className="h-px w-16 bg-foreground/30 sm:w-24" />
        <h2 className="text-3xl font-bold text-foreground sm:text-4xl whitespace-nowrap">
          {title}
        </h2>
        <span className="h-px w-16 bg-foreground/30 sm:w-24" />
        <span className="size-2 rounded-full bg-foreground" />
      </div>
      {description ? (
        <p className="mt-3 text-lg text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function InfoPill({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
      <Icon className="size-4" />
      {label}
    </span>
  );
}

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary";
}) {
  const styles =
    variant === "secondary"
      ? "bg-muted text-foreground"
      : "bg-primary text-primary-foreground";
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold", styles)}>
      {children}
    </span>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
