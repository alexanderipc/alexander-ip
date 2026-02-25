"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";

interface CheckoutButtonProps {
  service?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function CheckoutButton({
  service = "consultation",
  children,
  size = "lg",
  className,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

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
          Redirecting to payment...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
