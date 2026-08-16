"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@jayant/web-ui/button";

export function SubmitButton({
  idleLabel,
  pendingLabel = "Please wait...",
  variant,
}: {
  idleLabel: string;
  pendingLabel?: string;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full"
      variant={variant}
      disabled={pending}
    >
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
