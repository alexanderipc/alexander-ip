"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/app/admin/actions";
import {
  getServiceLabel,
  DEFAULT_TIMELINES,
  calculateDeliveryDate,
} from "@/lib/portal/status";
import type { ServiceType } from "@/lib/supabase/types";
import Container from "@/components/ui/Container";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";

const SERVICE_OPTIONS: ServiceType[] = [
  "consultation",
  "patent_search",
  "patent_drafting",
  "patent_prosecution",
  "international_filing",
  "fto",
  "illustrations",
  "filing",
  "ip_valuation",
  "custom",
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD ($)" },
  { value: "GBP", label: "GBP (\u00A3)" },
  { value: "EUR", label: "EUR (\u20AC)" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType>("patent_drafting");
  const [timelineDays, setTimelineDays] = useState<string>(
    String(DEFAULT_TIMELINES.patent_drafting || "")
  );

  const today = new Date().toISOString().split("T")[0];
  const estimatedDelivery =
    timelineDays && parseInt(timelineDays)
      ? calculateDeliveryDate(today, parseInt(timelineDays))
      : null;

  function handleServiceChange(value: ServiceType) {
    setServiceType(value);
    const defaultDays = DEFAULT_TIMELINES[value];
    setTimelineDays(defaultDays ? String(defaultDays) : "");
  }

  async function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      try {
        const result = await createProject(formData);
        if (result.success) {
          setSuccess(true);
          setTimeout(() => {
            router.push(`/admin/projects/${result.projectId}`);
          }, 1500);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create project"
        );
      }
    });
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-teal-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-navy mb-2">
            Project Created
          </h2>
          <p className="text-slate-500">Redirecting to project details...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-navy mb-6">New Project</h1>

      <form action={handleSubmit} className="max-w-2xl space-y-6">
        {/* Client */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Client
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="client_email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Client Email *
              </label>
              <input
                id="client_email"
                name="client_email"
                type="email"
                required
                placeholder="client@example.com"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                New clients will receive a portal login automatically.
              </p>
            </div>
            <div>
              <label
                htmlFor="client_name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Client Name
              </label>
              <input
                id="client_name"
                name="client_name"
                type="text"
                placeholder="John Doe"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Project Details
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="service_type"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Service Type *
              </label>
              <select
                id="service_type"
                name="service_type"
                required
                value={serviceType}
                onChange={(e) =>
                  handleServiceChange(e.target.value as ServiceType)
                }
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {SERVICE_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {getServiceLabel(st)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Project Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="e.g., Adjustable Elastic Sock — US Utility Patent"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={2}
                placeholder="Brief description of the invention or project scope"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label
                htmlFor="jurisdictions"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Jurisdictions
              </label>
              <input
                id="jurisdictions"
                name="jurisdictions"
                type="text"
                placeholder="US, GB, EP (comma-separated)"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Timeline & Pricing */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Timeline & Pricing
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="timeline_days"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Timeline (days)
              </label>
              <input
                id="timeline_days"
                name="timeline_days"
                type="number"
                min="1"
                value={timelineDays}
                onChange={(e) => setTimelineDays(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {estimatedDelivery && (
                <p className="text-xs text-slate-500 mt-1">
                  Est. delivery:{" "}
                  {new Date(estimatedDelivery).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div>
                <label
                  htmlFor="price_paid"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Price (smallest unit)
                </label>
                <input
                  id="price_paid"
                  name="price_paid"
                  type="number"
                  min="0"
                  placeholder="e.g., 250000"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="currency"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  defaultValue="USD"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Initial Note */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Initial Note (Client-Visible)
          </h2>
          <textarea
            name="note"
            rows={3}
            placeholder="Optional message shown to the client (e.g., 'Project created. I'll begin with a review of the prior art landscape before drafting begins.')"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Creating..." : "Create Project"}
          </button>
          <Link
            href="/admin"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
