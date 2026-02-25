"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";

const serviceOptions = [
  "Patent Consultation ($125)",
  "Patent Search ($335+)",
  "Patent Drafting ($995+)",
  "Patent Prosecution / Office Action ($450+)",
  "International Filing / PCT ($600+)",
  "IP Valuation ($2,250+)",
  "Other / Not sure",
];

const referralOptions = [
  "Fiverr",
  "Google Search",
  "Referral from someone",
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

export default function IntakeForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

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
          Many thanks for getting in touch. I&apos;ll review your enquiry and
          respond within 24&ndash;48 hours with tailored advice on the best path
          forward.
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

      {/* Country */}
      <div>
        <label htmlFor="country" className="block text-sm font-medium text-navy mb-1.5">
          Country
        </label>
        <input
          type="text"
          id="country"
          name="country"
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent text-sm"
          placeholder="Your country"
        />
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
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent text-sm bg-white"
        >
          <option value="">Select a service...</option>
          {serviceOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
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
          placeholder="Please provide a high-level description of your invention. Don't worry about confidentiality at this stage — keep it general. I'll arrange an NDA before you share detailed technical information."
        />
      </div>

      {/* Referral & Timeline */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="referral" className="block text-sm font-medium text-navy mb-1.5">
            How Did You Hear About Us?
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
          I understand that services start from $125 for consultations and
          typical patent drafting packages range from $995&ndash;$2,370.
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
          <a href="mailto:hello@alexander-ip.com" className="underline">
            hello@alexander-ip.com
          </a>{" "}
          directly.
        </p>
      )}
    </form>
  );
}
