import { redirect } from "next/navigation";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const BASE_URL = "https://www.alexander-ip.com";

async function findProjectByOffer(offerId: string): Promise<string | null> {
  const adminClient = createAdminClient();

  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }

    const { data } = await adminClient
      .from("offers")
      .select("project_id")
      .eq("id", offerId)
      .maybeSingle();

    if (data?.project_id) return data.project_id;
  }

  return null;
}

async function generateMagicLinkToken(email: string): Promise<string | null> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error || !data?.properties?.hashed_token) {
    console.error("[offer-success] Failed to generate magic link:", error?.message);
    return null;
  }

  return data.properties.hashed_token;
}

export default async function OfferSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{
    session_id?: string;
    installment?: string;
    total?: string;
    token?: string;
  }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const sessionId = sp.session_id;
  const installment = sp.installment ? parseInt(sp.installment, 10) : 0;
  const total = sp.total ? parseInt(sp.total, 10) : 0;

  const isInstallmentPlan = total > 1;
  const isFullyPaid = isInstallmentPlan && installment >= total;
  const hasRemaining = isInstallmentPlan && !isFullyPaid;

  // For partial installments (not the first), the project already exists.
  // Show the installment status page and link back to the offer for the next payment.
  // We still try to deep-link them to their project if we can.
  if (hasRemaining && installment > 1) {
    // Project was created on installment 1 — try to find it
    let projectId: string | null = null;

    if (token) {
      const adminClient = createAdminClient();
      const { data: offer } = await adminClient
        .from("offers")
        .select("project_id, client_email")
        .eq("token", token)
        .maybeSingle();

      if (offer?.project_id) {
        projectId = offer.project_id;
      }

      if (offer?.client_email) {
        const hashedToken = await generateMagicLinkToken(offer.client_email);
        if (hashedToken) {
          const next = projectId ? `/portal/projects/${projectId}` : "/portal";
          const verifyUrl = `${BASE_URL}/auth/verify?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink&next=${encodeURIComponent(next)}`;
          redirect(verifyUrl);
        }
      }
    }

    // Fallback: static installment status page
    return <InstallmentStatusPage installment={installment} total={total} token={token} />;
  }

  // For single payments and first installments (or final installment), redirect to project
  if (!sessionId || !process.env.STRIPE_SECRET_KEY) {
    return <InstallmentStatusPage installment={installment} total={total} token={token} fullyPaid={isFullyPaid} />;
  }

  let clientEmail: string | null = null;
  let offerId: string | null = null;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    clientEmail = session.customer_details?.email || null;
    offerId = session.metadata?.offer_id || null;
  } catch {
    return <InstallmentStatusPage installment={installment} total={total} token={token} fullyPaid={isFullyPaid} />;
  }

  if (!clientEmail || !offerId) {
    return <InstallmentStatusPage installment={installment} total={total} token={token} fullyPaid={isFullyPaid} />;
  }

  // Look up the project (webhook may still be processing on first payment)
  const projectId = await findProjectByOffer(offerId);

  const hashedToken = await generateMagicLinkToken(clientEmail);

  if (!hashedToken) {
    return <InstallmentStatusPage installment={installment} total={total} token={token} fullyPaid={isFullyPaid} />;
  }

  const next = projectId ? `/portal/projects/${projectId}` : "/portal";
  const verifyUrl = `${BASE_URL}/auth/verify?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink&next=${encodeURIComponent(next)}`;

  redirect(verifyUrl);
}

/* ── Static fallback for installment plans ────────────────────────── */

function InstallmentStatusPage({
  installment,
  total,
  token,
  fullyPaid = false,
}: {
  installment: number;
  total: number;
  token?: string;
  fullyPaid?: boolean;
}) {
  const isInstallmentPlan = total > 1;
  const hasRemaining = isInstallmentPlan && !fullyPaid && installment < total;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12">
          <CheckCircle className="w-20 h-20 text-teal-500 mx-auto mb-6" />

          {(!isInstallmentPlan || fullyPaid) && (
            <>
              <h1 className="text-2xl font-bold text-navy mb-3">
                {fullyPaid ? "All installments paid" : "Payment received"}
              </h1>
              <p className="text-slate-600 mb-8 leading-relaxed">
                {fullyPaid
                  ? "Thank you! All installments for this project have been completed."
                  : "Thank you! Your project has been created and you will receive an email with a link to your project dashboard shortly."}
              </p>
            </>
          )}

          {hasRemaining && (
            <>
              <h1 className="text-2xl font-bold text-navy mb-3">
                Installment {installment} of {total} paid
              </h1>
              <p className="text-slate-600 mb-4 leading-relaxed">
                {installment === 1
                  ? "Thank you! Your project has been created and you will receive an email with a link to your project dashboard shortly."
                  : "Thank you! Your payment has been recorded."}
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
              href="/auth/login"
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
