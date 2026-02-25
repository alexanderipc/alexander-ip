import { Metadata } from "next";
import { CheckCircle2, Mail, Clock, ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Booking Confirmed | Alexander IP Consulting",
  description: "Your consultation has been booked successfully.",
  robots: { index: false, follow: false },
};

export default function BookingSuccessPage() {
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
            Thank you for booking a patent consultation. I&apos;ll be in touch
            shortly to arrange a time that works for you.
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
                    You&apos;ll receive a receipt from Stripe and a personal
                    email from me within 24 hours.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-blue" />
                </div>
                <div>
                  <p className="font-medium text-navy text-sm">
                    Schedule Your Session
                  </p>
                  <p className="text-slate-500 text-sm">
                    I&apos;ll propose available times for your consultation via
                    email. Sessions typically run 45&ndash;60 minutes via video
                    call.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-blue" />
                </div>
                <div>
                  <p className="font-medium text-navy text-sm">
                    Prepare Your Ideas
                  </p>
                  <p className="text-slate-500 text-sm">
                    In the meantime, think about what you&apos;d like to
                    discuss. A brief description of your invention and any
                    specific questions will help us make the most of the session.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/">Return to Homepage</Button>
            <Button href="/services" variant="outline">
              View Other Services
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
