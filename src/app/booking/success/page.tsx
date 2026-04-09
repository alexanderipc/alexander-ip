import { Metadata } from "next";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { CheckCircle2, Mail, FolderOpen } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment Confirmed | Alexander IP",
  description: "Your payment has been received successfully.",
  robots: { index: false, follow: false },
};

const BASE_URL = "https://www.alexander-ip.com";

/** Try to find the project by payment_intent ID, retrying a few times to handle
 *  the race between Stripe's redirect and our webhook processing. */
async function findProjectByPaymentIntent(
  paymentIntentId: string
): Promise<string | null> {
  const adminClient = createAdminClient();

  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) {
      // Wait before retrying: 500ms, 1s, 1.5s
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }

    const { data } = await adminClient
      .from("projects")
      .select("id")
      .eq("stripe_payment_id", paymentIntentId)
      .maybeSingle();

    if (data?.id) return data.id;
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
    console.error("[success] Failed to generate magic link:", error?.message);
    return null;
  }

  return data.properties.hashed_token;
}

export default async function BookingSuccessPage(props: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const searchParams = await props.searchParams;
  const sessionId = searchParams.session_id;

  if (!sessionId || !process.env.STRIPE_SECRET_KEY) {
    // No session — show generic confirmation page
    return <StaticSuccessPage />;
  }

  let serviceSlug: string | null = null;
  let clientEmail: string | null = null;
  let paymentIntentId: string | null = null;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    serviceSlug = session.metadata?.service || null;
    clientEmail = session.customer_details?.email || null;
    paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent as Stripe.PaymentIntent | null)?.id || null;
  } catch {
    return <StaticSuccessPage />;
  }

  const isConsultation = serviceSlug === "consultation";

  // Consultations have no portal project — show the static page
  if (isConsultation) {
    return <StaticSuccessPage isConsultation />;
  }

  // For all other services, try to authenticate the client and land them on their project
  if (!clientEmail) {
    return <StaticSuccessPage />;
  }

  // Look up the project (webhook may still be processing)
  let projectId: string | null = null;
  if (paymentIntentId) {
    projectId = await findProjectByPaymentIntent(paymentIntentId);
  }

  // Generate a magic link token to authenticate the client immediately
  const hashedToken = await generateMagicLinkToken(clientEmail);

  if (!hashedToken) {
    // Couldn't generate token — fall back to static page
    return <StaticSuccessPage />;
  }

  const next = projectId ? `/portal/projects/${projectId}` : "/portal";
  const verifyUrl = `${BASE_URL}/auth/verify?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink&next=${encodeURIComponent(next)}`;

  redirect(verifyUrl);
}

/* ── Static fallback (consultation or error path) ─────────────────── */

function StaticSuccessPage({ isConsultation = false }: { isConsultation?: boolean }) {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white">
      <Container size="narrow">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
            Payment Received
          </h1>

          <p className="text-lg text-slate-600 mb-10 max-w-lg mx-auto">
            {isConsultation
              ? "Thank you for booking a patent consultation. We\u2019ll be in touch shortly to arrange a time that works for you."
              : "Thank you \u2014 your payment has been received and your project is being set up."}
          </p>

          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md mx-auto mb-10">
            <h2 className="font-semibold text-navy mb-4 text-left">
              What Happens Next
            </h2>
            <div className="space-y-4 text-left">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-blue" />
                </div>
                <div>
                  <p className="font-medium text-navy text-sm">
                    Confirmation Email
                  </p>
                  <p className="text-slate-500 text-sm">
                    {isConsultation
                      ? "You\u2019ll receive a receipt from Stripe and a personal email from us within 24 hours."
                      : "You\u2019ll receive a receipt from Stripe and a welcome email with a link to your account."}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-4 h-4 text-blue" />
                </div>
                <div>
                  {isConsultation ? (
                    <>
                      <p className="font-medium text-navy text-sm">
                        Schedule Your Session
                      </p>
                      <p className="text-slate-500 text-sm">
                        We&apos;ll propose available times for your consultation
                        via email.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-navy text-sm">
                        Project Created
                      </p>
                      <p className="text-slate-500 text-sm">
                        Your project has been set up. Sign in below to access
                        it directly.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/auth/login">Sign In to Portal</Button>
            <Button href="/" variant="outline">
              Return to Homepage
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
