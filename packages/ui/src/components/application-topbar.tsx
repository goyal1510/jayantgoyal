"use client";

import type { ReactNode } from "react";

import { ApplicationHeader } from "./application-shell";

/** Shared top-bar slot contract; apps still own breadcrumb and controls. */
export function ApplicationTopbar({
  breadcrumb,
  actions,
  className,
  sidebarControl,
}: {
  breadcrumb: ReactNode;
  actions?: ReactNode;
  className?: string;
  sidebarControl?: ReactNode;
}) {
  return (
    <ApplicationHeader
      breadcrumb={breadcrumb}
      actions={actions}
      className={className}
      sidebarControl={sidebarControl}
    />
  );
}
