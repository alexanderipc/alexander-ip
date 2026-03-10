"use client";

import { useTransition } from "react";
import { cancelOffer, resendOfferEmail } from "@/app/admin/actions";
import { Mail, XCircle } from "lucide-react";

export default function OfferActions({ offerId }: { offerId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleResend() {
    startTransition(async () => {
      try {
        await resendOfferEmail(offerId);
      } catch (err) {
        console.error("Failed to resend:", err);
      }
    });
  }

  function handleCancel() {
    if (!confirm("Cancel this offer? The client will no longer be able to pay.")) return;
    startTransition(async () => {
      try {
        await cancelOffer(offerId);
      } catch (err) {
        console.error("Failed to cancel:", err);
      }
    });
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <button
        onClick={handleResend}
        disabled={isPending}
        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
        title="Resend email"
      >
        <Mail className="w-3.5 h-3.5" />
        Resend
      </button>
      <button
        onClick={handleCancel}
        disabled={isPending}
        className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
        title="Cancel offer"
      >
        <XCircle className="w-3.5 h-3.5" />
        Cancel
      </button>
    </div>
  );
}
