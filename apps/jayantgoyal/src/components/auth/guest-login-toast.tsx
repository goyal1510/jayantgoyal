"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export function GuestLoginToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const remaining = searchParams.get("guest_remaining");
  const loginSuccess = searchParams.get("login_success");

  useEffect(() => {
    if (remaining === null && loginSuccess === null) return;

    if (remaining !== null) {
      const count = Number(remaining);
      toast.success(
        count > 0
          ? `Logged in as guest. ${count} guest login${count === 1 ? "" : "s"} remaining.`
          : "Logged in as guest. This was your last guest login.",
        { id: "guest-login" }
      );
    } else if (loginSuccess !== null) {
      toast.success("Logged in successfully.", { id: "login-success" });
    }

    // Clean up the query params from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete("guest_remaining");
    params.delete("login_success");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [remaining, loginSuccess, pathname, router, searchParams]);

  return null;
}
