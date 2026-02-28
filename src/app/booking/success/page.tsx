import { Metadata } from "next";
import Stripe from "stripe";
import { CheckCircle2, Mail, FolderOpen, ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment Confirmed | Alexander IP",
  description: "Your payment has been received successfully.",
  robots: { index: false, follow: false },
};

const SERVICE_NAMES: Record<string, string> = {
  consultation: "Patent Consultation",
  "patent-search-basic": "Patent Search (Basic)",
  "patent-search-standard": "Patent Search (Standard)",
  "patent-search-premium": "Patent Search (Premium)",
  "patent-drafting-simple": "Patent Drafting (Simple)",
  "patent-drafting-mid": "Patent Drafting (Mid-Tier)",
  "patent-drafting-complex": "Patent Drafting (Complex)",
  "fto-landscape": "FTO — Patent Landscape",
  "fto-simple": "FTO (Simple)",
  "fto-complex": "FTO (Complex)",
  custom: "Custom Project",
};

export default async function BookingSuccessPage(props: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const searchParams = await props.searchParams;
  const sessionId = searchParams.session_id;

  let serviceSlug: string | null = null;

  // Try to fetch service info from Stripe session
  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      serviceSlug = session.metadata?.service || null;
    } catch {
      // Silently fall back to generic messaging
    }
  }

  const isConsultation = serviceSlug === "consultation";
  const serviceName = serviceSlug
    ? SERVICE_NAMES[serviceSlug] || "your order"
    : null;

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
              : serviceName
                ? `Thank you \u2014 your payment for ${serviceName} has been received and your project is being set up.`
                : "Thank you \u2014 your payment has been received and your project is being set up."}
          </p>

          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md mx-auto mb-10">
            <h2 className="font-semibold text-navy mb-4 text-left">
              What Happens Next
            </h2>
            <div className="space-y-4 text-left">
              {/* Step 1: Confirmation Email */}
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

              {/* Step 2 */}
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
                        via email. Sessions typically run 45&ndash;60 minutes
                        via video call.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-navy text-sm">
                        Project Created
                      </p>
                      <p className="text-slate-500 text-sm">
                        Your project has been set up in your account. You
                        can track progress and receive updates in real time.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-blue" />
                </div>
                <div>
                  {isConsultation ? (
                    <>
                      <p className="font-medium text-navy text-sm">
                        Prepare Your Ideas
                      </p>
                      <p className="text-slate-500 text-sm">
                        Think about what you&apos;d like to discuss. A brief
                        description of your invention and any questions will
                        help us make the most of the session.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-navy text-sm">
                        Work Begins
                      </p>
                      <p className="text-slate-500 text-sm">
                        Alexander IP will review your project and begin work
                        within 1&ndash;2 business days.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            To access your projects, use the sign-in link in your welcome
            email, or enter the email you used at checkout below.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/auth/login">Sign In</Button>
            <Button href="/" variant="outline">
              Return to Homepage
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
