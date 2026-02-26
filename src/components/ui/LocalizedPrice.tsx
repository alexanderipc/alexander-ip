"use client";

import { useState, useEffect } from "react";
import {
  getCurrencyFromBrowserLocale,
  getDisplayPrice,
  convertPrice,
  convertRange,
} from "@/lib/pricing";

interface LocalizedPriceProps {
  /** Pre-defined service key (e.g. "consultation") — uses fixed checkout prices */
  service?: string;
  /** Raw USD dollar amount to convert (e.g. 995) */
  amount?: number;
  /** USD range — provide [from, to] (e.g. [1500, 2500]) */
  range?: [number, number];
  /** Prefix text (e.g. "From") */
  prefix?: string;
  /** Suffix text (e.g. "+") */
  suffix?: string;
  /** Fallback while detecting */
  fallback?: string;
  className?: string;
}

export default function LocalizedPrice({
  service,
  amount,
  range,
  prefix,
  suffix,
  fallback,
  className,
}: LocalizedPriceProps) {
  const [display, setDisplay] = useState(fallback || "");

  useEffect(() => {
    const currency = getCurrencyFromBrowserLocale();

    let price: string;
    if (service) {
      price = getDisplayPrice(service, currency);
    } else if (range) {
      price = convertRange(range[0], range[1], currency);
    } else if (amount !== undefined) {
      price = convertPrice(amount, currency);
    } else {
      price = fallback || "";
    }

    const parts: string[] = [];
    if (prefix) parts.push(prefix);
    parts.push(price);
    if (suffix) parts.push(suffix);
    if (currency === "GBP") parts.push("+VAT");
    setDisplay(parts.join(" ").trim());
  }, [service, amount, range, prefix, suffix, fallback]);

  return <span className={className}>{display}</span>;
}
