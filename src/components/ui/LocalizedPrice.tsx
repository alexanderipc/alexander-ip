"use client";

import { useState, useEffect } from "react";
import {
  getCurrencyFromBrowserLocale,
  getDisplayPrice,
} from "@/lib/pricing";

interface LocalizedPriceProps {
  service?: string;
  fallback?: string;
  className?: string;
}

export default function LocalizedPrice({
  service = "consultation",
  fallback = "$125",
  className,
}: LocalizedPriceProps) {
  const [display, setDisplay] = useState(fallback);

  useEffect(() => {
    // Detect currency instantly from browser locale — no network round-trip
    const currency = getCurrencyFromBrowserLocale();
    const price = getDisplayPrice(service, currency);
    setDisplay(price);
  }, [service]);

  return <span className={className}>{display}</span>;
}
