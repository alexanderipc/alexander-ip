"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

const VALID_SERVICES = [
  "consultation",
  "patent-search-basic",
  "patent-search-standard",
  "patent-search-premium",
  "patent-drafting-simple",
  "patent-drafting-mid",
  "patent-drafting-complex",
  "fto-landscape",
  "fto-simple",
  "fto-complex",
  "custom",
];

function CheckoutInner() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const service = searchParams.get("service");

    if (!service || !VALID_SERVICES.includes(service)) {
      setError("Invalid or missing service. Please use a valid checkout link.");
      return;
    }

    // Build the checkout payload
    const payload: Record<string, unknown> = { service };

    // Support custom project amounts: /checkout?service=custom&amount=50000&currency=gbp&description=...
    const amount = searchParams.get("amount");
    if (service === "custom" && amount) {
      const parsed = parseInt(amount, 10);
      if (isNaN(parsed) || parsed < 50) {
        setError("Invalid amount.");
        return;
      }
      payload.customAmount = parsed;
    }

    const currency = searchParams.get("currency");
    if (currency) payload.currency = currency;

    const description = searchParams.get("description");
    if (description) payload.description = description;

    // Redirect to Stripe
    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError(data.error || "Failed to create checkout session.");
        }
      })
      .catch(() => {
        setError("Something went wrong. Please try again.");
      });
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <a
            href="/services"
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            View all services
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-slate-600">Redirecting to secure payment...</p>
      </div>
    </div>
  );
}

export default function CheckoutRedirect() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Redirecting to secure payment...</p>
          </div>
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}
