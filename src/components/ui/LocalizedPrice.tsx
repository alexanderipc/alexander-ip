"use client";

import { useState, useEffect } from "react";

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
    fetch(`/api/checkout?service=${service}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.display) setDisplay(data.display);
      })
      .catch(() => {
        // Keep fallback
      });
  }, [service]);

  return <span className={className}>{display}</span>;
}
