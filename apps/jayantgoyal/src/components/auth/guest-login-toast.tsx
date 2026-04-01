"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export function GuestLoginToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const remaining = searchParams.get("guest_remaining");

  useEffect(() => {
    if (remaining === null) return;

    const count = Number(remaining);
    toast.success(
      count > 0
        ? `Logged in as guest. ${count} guest login${count === 1 ? "" : "s"} remaining.`
        : "Logged in as guest. This was your last guest login."
    );

    // Clean up the query param from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete("guest_remaining");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [remaining, pathname, router, searchParams]);

  return null;
}
