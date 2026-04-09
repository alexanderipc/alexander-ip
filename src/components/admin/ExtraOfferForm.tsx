"use client";

import { useState, useTransition } from "react";
import { createExtraOffer } from "@/app/admin/actions";
import { Plus, X, Send, Loader2 } from "lucide-react";

interface ExtraOfferFormProps {
  projectId: string;
  clientEmail: string;
  clientName: string | null;
  currency: string;
}

export default function ExtraOfferForm({
  projectId,
  clientEmail,
  clientName,
  currency,
}: ExtraOfferFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createExtraOffer(formData);
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
      }, 2000);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Send Extra Offer
      </button>
    );
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
        <p className="text-sm font-medium text-green-700">Offer sent to {clientEmail}</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-navy">New Extra Offer</h4>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="client_email" value={clientEmail} />
      <input type="hidden" name="client_name" value={clientName || ""} />
      <input type="hidden" name="currency" value={currency} />

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Title
        </label>
        <input
          name="title"
          required
          placeholder="e.g. Expedited delivery"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Description (optional)
        </label>
        <textarea
          name="description"
          rows={2}
          placeholder="Details shown to the client..."
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Amount ({currency})
          </label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.50"
            required
            placeholder="150.00"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="w-28">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Installments
          </label>
          <select
            name="installments"
            defaultValue="1"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Send Offer
          </>
        )}
      </button>
    </form>
  );
}
