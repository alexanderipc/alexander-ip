"use client";

import { useState, useTransition } from "react";
import { MapPin } from "lucide-react";
import { updateBillingAddress } from "@/app/portal/actions";
import type { BillingAddress } from "@/app/portal/actions";

interface Props {
  initial: BillingAddress;
}

export default function BillingAddressSettings({ initial }: Props) {
  const [address, setAddress] = useState<BillingAddress>(initial);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(field: keyof BillingAddress, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
    setError(null);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updateBillingAddress(address);
        setSaved(true);
        setError(null);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save address"
        );
      }
    });
  }

  const fields: { key: keyof BillingAddress; label: string; placeholder: string }[] = [
    { key: "address_line1", label: "Address line 1", placeholder: "123 High Street" },
    { key: "address_line2", label: "Address line 2", placeholder: "Suite 4 (optional)" },
    { key: "city", label: "City", placeholder: "London" },
    { key: "postal_code", label: "Postal / ZIP code", placeholder: "SW1A 1AA" },
    { key: "country", label: "Country", placeholder: "United Kingdom" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-5 h-5 text-blue" />
        <h2 className="text-lg font-semibold text-navy">Billing Address</h2>
        {isPending && (
          <span className="text-xs text-slate-400 ml-2">Saving...</span>
        )}
        {saved && !isPending && (
          <span className="text-xs text-green-600 ml-2">Saved</span>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-4">
        This address appears on your invoices. It is collected automatically
        during checkout but you can update it here at any time.
      </p>

      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.key}>
            <label
              htmlFor={f.key}
              className="block text-sm font-medium text-navy mb-1"
            >
              {f.label}
            </label>
            <input
              id={f.key}
              type="text"
              value={address[f.key]}
              onChange={(e) => handleChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              disabled={isPending}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy placeholder:text-slate-400 focus:border-blue focus:ring-1 focus:ring-blue/30 outline-none transition-colors disabled:opacity-60"
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-dark transition-colors disabled:opacity-60 disabled:cursor-wait"
      >
        {isPending ? "Saving..." : "Save address"}
      </button>
    </div>
  );
}
