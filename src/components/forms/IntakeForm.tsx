"use client";

import { useState, useEffect } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { getCurrencyFromBrowserLocale, convertPrice } from "@/lib/pricing";

const serviceOptionsBase = [
  { label: "Patent Consultation", slug: "consultation", usd: 125 },
  { label: "Patent Search", slug: "patent-search", usd: 335 },
  { label: "Patent Drafting", slug: "patent-drafting", usd: 995 },
  { label: "Patent Prosecution", slug: "patent-prosecution", usd: null },
  { label: "International Filing / PCT", slug: "international-filing", usd: 600 },
  { label: "FTO / Infringement Check", slug: "fto", usd: 600 },
  { label: "Portfolio Management", slug: "portfolio-management", usd: null },
  { label: "Not Sure", slug: "not-sure", usd: null },
];

const referralOptions = [
  "Google Search",
  "Referral from someone",
  "Fiverr",
  "LinkedIn",
  "Other",
];

const timelineOptions = [
  "Standard (no rush)",
  "Within 30 days",
  "Within 14 days",
  "Urgent (within 7 days)",
  "Not sure yet",
];

const priorSearchOptions = [
  "Yes",
  "No",
  "Not sure",
];

interface IntakeFormProps {
  defaultService?: string;
}

export default function IntakeForm({ defaultService }: IntakeFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serviceOptions, setServiceOptions] = useState<{ value: string; label: string }[]>([]);
  const [budgetText, setBudgetText] = useState(
    "I understand that services start from $125 for consultations and typical patent drafting packages range from $995\u2013$2,370."
  );

  useEffect(() => {
    const currency = getCurrencyFromBrowserLocale();

    const vatSuffix = currency === "GBP" ? " +VAT" : "";
    const options = serviceOptionsBase.map((s) => ({
      value: s.slug,
      label: s.usd != null
        ? `${s.label} (from ${convertPrice(s.usd, currency)}${vatSuffix})`
        : s.label,
    }));
    setServiceOptions(options);

    const consultPrice = convertPrice(125, currency);
    const draftLow = convertPrice(995, currency);
    const draftHigh = convertPrice(2370, currency);
    setBudgetText(
      `I understand that services start from ${consultPrice}${vatSuffix} for consultations and typical patent drafting packages range from ${draftLow}\u2013${draftHigh}${vatSuffix}.`
    );
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-blue/5 border border-blue/20 rounded-xl p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-blue mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-navy mb-2">
          Enquiry Received
        </h3>
        <p className="text-slate-600">
          Many thanks for getting in touch. Alexander IP will review your
          enquiry and respond within 24&ndash;48 hours with tailored advice on
          the best path forward.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name & Email */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-navy mb-1.5">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent text-sm"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-navy mb-1.5">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent text-sm"
            placeholder="your@email.com"
          />
        </div>
      </div>

      {/* Service */}
      <div>
        <label htmlFor="service" className="block text-sm font-medium text-navy mb-1.5">
          Service Interested In *
        </label>
        <select
          id="service"
          name="service"
          required
          defaultValue={defaultService || ""}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent text-sm bg-white"
        >
          <option value="">Select a service...</option>
          {serviceOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Invention description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-navy mb-1.5">
          Brief Description of Your Invention *
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent text-sm resize-y"
          placeholder="Describe what you've built and what you're trying to protect. Keep it general at this stage — an NDA will be arranged before you share detailed technical information."
        />
      </div>

      {/* Target countries & Prior search */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="countries" className="block text-sm font-medium text-navy mb-1.5">
            Target Country/Countries for Filing
          </label>
          <input
            type="text"
            id="countries"
            name="countries"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent text-sm"
            placeholder="e.g. US, UK, Europe"
          />
        </div>
        <div>
          <label htmlFor="prior_search" className="block text-sm font-medium text-navy mb-1.5">
            Already Conducted a Patent Search?
          </label>
          <select
            id="prior_search"
            name="prior_search"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent text-sm bg-white"
          >
            <option value="">Select...</option>
            {priorSearchOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Referral & Timeline */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="referral" className="block text-sm font-medium text-navy mb-1.5">
            How Did You Find Alexander IP?
          </label>
          <select
            id="referral"
            name="referral"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent text-sm bg-white"
          >
            <option value="">Select...</option>
            {referralOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="timeline" className="block text-sm font-medium text-navy mb-1.5">
            Preferred Timeline
          </label>
          <select
            id="timeline"
            name="timeline"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent text-sm bg-white"
          >
            <option value="">Select...</option>
            {timelineOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Budget awareness */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="budget"
          name="budget_aware"
          className="mt-1 w-4 h-4 text-blue border-slate-300 rounded focus:ring-blue"
        />
        <label htmlFor="budget" className="text-sm text-slate-600">
          {budgetText}
        </label>
      </div>

      {/* Submit */}
      <div>
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Enquiry
            </>
          )}
        </Button>
      </div>

      {status === "error" && (
        <p className="text-red-600 text-sm">
          Something went wrong. Please try again or email{" "}
          <a href="mailto:alexanderip.contact@gmail.com" className="underline">
            alexanderip.contact@gmail.com
          </a>{" "}
          directly.
        </p>
      )}
    </form>
  );
}
