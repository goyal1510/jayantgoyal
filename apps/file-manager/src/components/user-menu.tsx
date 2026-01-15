"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function UserMenu({ userEmail }: { userEmail: string | null }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = React.useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      toast.success("Logged out successfully");
      // Use window.location for full page navigation to ensure cookies are cleared
      window.location.href = "/login";
    } catch (error) {
      toast.error("Failed to log out. Please try again.");
      setIsLoggingOut(false);
    }
  }, []);

  if (!userEmail) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">{userEmail}</span>
      <Button
        variant="outline"
        onClick={handleLogout}
        disabled={isLoggingOut}
        aria-disabled={isLoggingOut}
      >
        {isLoggingOut ? "Logging out..." : "Logout"}
      </Button>
    </div>
  );
}
