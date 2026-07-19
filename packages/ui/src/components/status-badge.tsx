import { Badge, type BadgeProps } from "./badge";

export function StatusBadge({
  status,
  className,
}: {
  status: "ready" | "draft" | "published" | "hidden" | "error" | "live";
  className?: string;
}) {
  const labels = {
    ready: "Ready",
    draft: "Draft",
    published: "Published",
    hidden: "Hidden",
    error: "Needs attention",
    live: "Live",
  } as const;
  const variants: Record<typeof status, BadgeProps["variant"]> = {
    ready: "outline",
    draft: "secondary",
    published: "default",
    hidden: "secondary",
    error: "destructive",
    live: "outline",
  };

  return (
    <Badge variant={variants[status]} className={className}>
      {labels[status]}
    </Badge>
  );
}

export function VisibilityBadge({
  visible,
  className,
}: {
  visible: boolean;
  className?: string;
}) {
  return (
    <Badge variant={visible ? "outline" : "secondary"} className={className}>
      {visible ? "Visible" : "Hidden"}
    </Badge>
  );
}
