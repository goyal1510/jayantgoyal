"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export function AuthToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const loginSuccess = searchParams.get("login_success");
  const signedOut = searchParams.get("signed_out");

  useEffect(() => {
    if (loginSuccess === null && signedOut === null) return;

    if (loginSuccess !== null) {
      toast.success("Logged in successfully.", { id: "login-success" });
    } else if (signedOut !== null) {
      toast.success("Signed out successfully.", { id: "signed-out" });
    }

    // Clean up the query params from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete("login_success");
    params.delete("signed_out");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [loginSuccess, signedOut, pathname, router, searchParams]);

  return null;
}
