import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import OfferPayButton from "@/components/offer/OfferPayButton";
import { getServiceLabel } from "@/lib/portal/status";
import type { ServiceType } from "@/lib/supabase/types";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  GBP: "\u00a3",
  EUR: "\u20ac",
};

export default async function OfferPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const adminClient = createAdminClient();

  const { data: offer } = await adminClient
    .from("offers")
    .select("*")
    .eq("token", token)
    .single();

  if (!offer) notFound();

  // Installment state
  const totalInstallments = offer.installments || 1;
  const paidInstallments = offer.installments_paid || 0;
  const isInstallmentPlan = totalInstallments > 1;
  const nextInstallment = paidInstallments + 1;
  const allInstallmentsPaid = paidInstallments >= totalInstallments;

  // Per-installment amount (ceiling for all but last; last absorbs remainder)
  const perInstallmentAmount = Math.ceil(offer.amount / totalInstallments);
  const lastInstallmentAmount = offer.amount - perInstallmentAmount * (totalInstallments - 1);
  const thisInstallmentAmount = nextInstallment === totalInstallments ? lastInstallmentAmount : perInstallmentAmount;

  // Lazy expiry check — only before first payment
  if (
    offer.status === "pending" &&
    paidInstallments === 0 &&
    offer.expires_at &&
    new Date(offer.expires_at) < new Date()
  ) {
    await adminClient
      .from("offers")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", offer.id);
    offer.status = "expired";
  }

  // If all installments paid but status still pending, treat as accepted
  if (allInstallmentsPaid && offer.status === "pending") {
    offer.status = "accepted";
  }

  const symbol = CURRENCY_SYMBOLS[offer.currency] || "$";
  const totalDisplayAmount = `${symbol}${(offer.amount / 100).toFixed(2)}`;
  const installmentDisplayAmount = `${symbol}${(thisInstallmentAmount / 100).toFixed(2)}`;
  const serviceLabel = getServiceLabel(offer.service_type as ServiceType);

  const isExpired = offer.status === "expired";
  const isCancelled = offer.status === "cancelled";
  const isAccepted = offer.status === "accepted";
  const isPending = offer.status === "pending";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-navy tracking-tight">Alexander IP</h1>
          <p className="text-slate-500 text-sm mt-1">Custom Offer</p>
        </div>

        {/* Offer Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Status banner for non-pending */}
          {isAccepted && (
            <div className="bg-green-50 border-b border-green-200 px-6 py-3 text-center">
              <p className="text-sm font-semibold text-green-700">
                {isInstallmentPlan
                  ? "All installments have been paid. Thank you!"
                  : "This offer has been accepted and paid."}
              </p>
            </div>
          )}
          {isExpired && (
            <div className="bg-red-50 border-b border-red-200 px-6 py-3 text-center">
              <p className="text-sm font-semibold text-red-700">This offer has expired.</p>
            </div>
          )}
          {isCancelled && (
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 text-center">
              <p className="text-sm font-semibold text-slate-500">This offer has been cancelled.</p>
            </div>
          )}

          <div className="p-8">
            {/* Title & Price */}
            <h2 className="text-xl font-bold text-navy mb-2">{offer.title}</h2>

            {isInstallmentPlan && isPending ? (
              <>
                <p className="text-sm text-slate-400 mb-1">Total: {totalDisplayAmount}</p>
                <p className="text-3xl font-extrabold text-navy mb-1">
                  {installmentDisplayAmount}
                </p>
                <p className="text-sm font-medium text-blue-600 mb-1">
                  Installment {nextInstallment} of {totalInstallments}
                </p>
              </>
            ) : (
              <p className="text-3xl font-extrabold text-navy mb-1">{totalDisplayAmount}</p>
            )}
            <p className="text-xs text-slate-400 mb-1">Exclusive of VAT where applicable</p>
            <p className="text-sm text-slate-500 mb-6">{serviceLabel}</p>

            {/* Installment progress bar */}
            {isInstallmentPlan && (isPending || isAccepted) && (
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>{paidInstallments} of {totalInstallments} paid</span>
                  <span>{Math.round((paidInstallments / totalInstallments) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(paidInstallments / totalInstallments) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Description */}
            {offer.description && (
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 mb-6">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {offer.description}
                </p>
              </div>
            )}

            {/* Details */}
            <div className="space-y-3 mb-8">
              {offer.timeline_days && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Estimated duration</span>
                  <span className="text-navy font-medium">{offer.timeline_days} days</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Service</span>
                <span className="text-navy font-medium">{serviceLabel}</span>
              </div>
              {isInstallmentPlan && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Payment plan</span>
                  <span className="text-navy font-medium">{totalInstallments} installments</span>
                </div>
              )}
            </div>

            {/* Pay Button */}
            {isPending && !allInstallmentsPaid && (
              <OfferPayButton
                token={token}
                amount={isInstallmentPlan ? installmentDisplayAmount : totalDisplayAmount}
                installmentLabel={
                  isInstallmentPlan
                    ? `Pay Installment ${nextInstallment} of ${totalInstallments} \u2014 ${installmentDisplayAmount}`
                    : undefined
                }
              />
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-8 py-4 bg-slate-50 text-center">
            <p className="text-xs text-slate-400">
              Secure payment via Stripe. By paying you agree to the{" "}
              <a href="https://www.alexander-ip.com/legal/terms" className="underline hover:text-slate-600">
                Terms of Service
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
