"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { getCurrencyFromBrowserLocale, getDisplayPrice } from "@/lib/pricing";

interface CheckoutButtonProps {
  service?: string;
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Label prefix shown before the price, e.g. "Book & Pay" */
  label?: string;
}

export default function CheckoutButton({
  service = "consultation",
  children,
  size = "lg",
  className,
  label = "Book & Pay",
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [priceDisplay, setPriceDisplay] = useState<string | null>(null);

  // Detect localised price instantly from browser locale
  useEffect(() => {
    const currency = getCurrencyFromBrowserLocale();
    setPriceDisplay(getDisplayPrice(service, currency));
  }, [service]);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Checkout error:", data);
        alert(
          data.error
            ? `Checkout error: ${data.error}${data.code ? ` (${data.code})` : ""}`
            : "Something went wrong. Please try again."
        );
        setLoading(false);
      }
    } catch (err) {
      console.error("Checkout fetch error:", err);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // If explicit children are provided, use them (backward-compatible)
  const buttonContent = children ?? (
    <>
      {label} — {priceDisplay || "…"}
    </>
  );

  return (
    <Button
      onClick={handleCheckout}
      size={size}
      className={className}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Redirecting to payment…
        </>
      ) : (
        buttonContent
      )}
    </Button>
  );
}
