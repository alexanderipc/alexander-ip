import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";

export default async function OfferSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ installment?: string; total?: string; token?: string }>;
}) {
  const params = await searchParams;
  const installment = params.installment ? parseInt(params.installment, 10) : 0;
  const total = params.total ? parseInt(params.total, 10) : 0;
  const token = params.token || null;

  const isInstallmentPlan = total > 1;
  const isFullyPaid = isInstallmentPlan && installment >= total;
  const hasRemaining = isInstallmentPlan && !isFullyPaid;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12">
          <CheckCircle className="w-20 h-20 text-teal-500 mx-auto mb-6" />

          {/* ── Single payment or fully paid installments ── */}
          {(!isInstallmentPlan || isFullyPaid) && (
            <>
              <h1 className="text-2xl font-bold text-navy mb-3">
                {isFullyPaid ? "All installments paid" : "Payment received"}
              </h1>
              <p className="text-slate-600 mb-8 leading-relaxed">
                {isFullyPaid
                  ? "Thank you! All installments for this project have been completed. Your project is now fully paid."
                  : "Thank you! Your project has been created and you will receive an email with a link to your project dashboard shortly."}
              </p>
            </>
          )}

          {/* ── Partial installment paid ── */}
          {hasRemaining && (
            <>
              <h1 className="text-2xl font-bold text-navy mb-3">
                Installment {installment} of {total} paid
              </h1>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Thank you! {installment === 1
                  ? "Your project has been created and you will receive an email with a link to your project dashboard shortly."
                  : "Your payment has been recorded."}
              </p>
              <p className="text-sm text-slate-500 mb-8">
                {total - installment} installment{total - installment !== 1 ? "s" : ""} remaining.
                {token && " You can return to the offer page to make your next payment when ready."}
              </p>
              {token && (
                <Link
                  href={`/offer/${token}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors mb-4"
                >
                  <ArrowRight className="w-4 h-4" />
                  Back to Offer
                </Link>
              )}
            </>
          )}

          <div className={hasRemaining && token ? "mt-2" : ""}>
            <Link
              href="https://www.alexander-ip.com/auth/login"
              className="inline-block px-8 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Go to My Projects
            </Link>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          Alexander IP &mdash; Patent Drafting & Office Correspondence
        </p>
      </div>
    </div>
  );
}
