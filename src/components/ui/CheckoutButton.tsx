"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";

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

  // Fetch localized price on mount
  useEffect(() => {
    fetch(`/api/checkout?service=${service}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.display) setPriceDisplay(data.display);
      })
      .catch(() => {
        // Fallback — don't show price if fetch fails
      });
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
        alert(data.error || "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // If explicit children are provided, use them (backward-compatible)
  // Otherwise, build a label from the localized price
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
