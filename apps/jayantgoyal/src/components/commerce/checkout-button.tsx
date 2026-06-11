"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@repo/ui/button";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
      on: (
        event: "payment.failed",
        callback: (response: unknown) => void,
      ) => void;
    };
  }
}

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    email?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayCheckoutResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type CheckoutResponse =
  | {
      provider?: "stripe";
      url: string;
      orderId: string;
      error?: string;
    }
  | {
      provider: "razorpay";
      orderId: string;
      razorpayOrderId: string;
      keyId: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      prefill?: {
        email?: string;
      };
      error?: string;
    };

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayCheckoutScript() {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Unable to load Razorpay Checkout."));
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

export function CheckoutButton({
  priceId,
  children = "Buy now",
  className,
  variant,
  size,
  iconOnly = false,
  ariaLabel,
}: {
  priceId?: string | null;
  children?: React.ReactNode;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  iconOnly?: boolean;
  ariaLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = React.useState(false);

  async function startCheckout() {
    if (!priceId) {
      toast("Checkout is not configured", {
        description: "This product is not connected to a price yet.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/commerce/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          successPath: "/account/purchases/:orderId?checkout=success",
          cancelPath: pathname || "/store",
        }),
      });

      if (response.status === 401) {
        router.push(
          `/welcome?redirect=${encodeURIComponent(pathname || "/pricing")}`,
        );
        return;
      }

      const payload = (await response.json()) as CheckoutResponse;
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to start checkout.");
      }

      if (payload.provider === "razorpay") {
        await loadRazorpayCheckoutScript();

        if (!window.Razorpay) {
          throw new Error("Razorpay Checkout did not initialize.");
        }

        const checkout = new window.Razorpay({
          key: payload.keyId,
          amount: payload.amount,
          currency: payload.currency,
          name: payload.name,
          description: payload.description,
          order_id: payload.razorpayOrderId,
          prefill: payload.prefill,
          theme: { color: "#111827" },
          handler: async (razorpayResponse) => {
            try {
              const verification = await fetch(
                "/api/commerce/checkout/verify",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderId: payload.orderId,
                    razorpayOrderId: razorpayResponse.razorpay_order_id,
                    razorpayPaymentId: razorpayResponse.razorpay_payment_id,
                    razorpaySignature: razorpayResponse.razorpay_signature,
                  }),
                },
              );
              const verificationPayload = (await verification.json()) as {
                error?: string;
                orderId?: string;
              };

              if (!verification.ok) {
                throw new Error(
                  verificationPayload.error ?? "Payment verification failed.",
                );
              }

              toast.success("Payment verified", {
                description: "Your product access is ready.",
              });
              router.push(
                verificationPayload.orderId
                  ? `/account/purchases/${verificationPayload.orderId}?checkout=success`
                  : "/account/purchases?checkout=success",
              );
              router.refresh();
            } catch (error) {
              toast.error("Payment verification failed", {
                description:
                  error instanceof Error
                    ? error.message
                    : "Payment succeeded, but access could not be verified.",
              });
            } finally {
              setIsLoading(false);
            }
          },
          modal: {
            ondismiss: () => setIsLoading(false),
          },
        });

        checkout.on("payment.failed", () => {
          setIsLoading(false);
          toast.error("Payment failed", {
            description: "No access was granted. Try checkout again.",
          });
        });
        checkout.open();
        return;
      }

      if (!payload.url) {
        throw new Error("Payment provider did not return a checkout URL.");
      }

      window.location.href = payload.url;
    } catch (error) {
      toast.error("Checkout unavailable", {
        description:
          error instanceof Error
            ? error.message
            : "Try again after payment setup is complete.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={startCheckout}
      disabled={!priceId || isLoading}
      className={className}
      variant={variant}
      size={size}
      aria-label={iconOnly ? (ariaLabel ?? "Buy") : undefined}
      title={
        !priceId
          ? "Checkout is not configured for this product yet."
          : iconOnly
            ? (ariaLabel ?? "Buy")
            : undefined
      }
    >
      {isLoading ? (
        <Loader2
          className={
            iconOnly ? "h-4 w-4 animate-spin" : "mr-2 h-4 w-4 animate-spin"
          }
        />
      ) : (
        <ShoppingCart className={iconOnly ? "h-4 w-4" : "mr-2 h-4 w-4"} />
      )}
      {iconOnly ? null : children}
    </Button>
  );
}
