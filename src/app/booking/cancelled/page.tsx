import { Metadata } from "next";
import { XCircle, ArrowLeft, Mail } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Booking Cancelled | Alexander IP Consulting",
  description: "Your consultation booking was cancelled.",
  robots: { index: false, follow: false },
};

export default function BookingCancelledPage() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white">
      <Container size="narrow">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-slate-400" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
            Booking Cancelled
          </h1>

          <p className="text-lg text-slate-600 mb-6 max-w-lg mx-auto">
            No worries &mdash; you haven&apos;t been charged. If you changed
            your mind or had a question, we&apos;re happy to help.
          </p>

          <p className="text-slate-500 mb-10 max-w-md mx-auto">
            If you&apos;d prefer to discuss your situation before committing,
            feel free to get in touch via the contact form or email us directly
            at{" "}
            <a
              href="mailto:alexanderip.contact@gmail.com"
              className="text-blue hover:text-blue-dark"
            >
              alexanderip.contact@gmail.com
            </a>
            .
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/services/consultation">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Consultation
            </Button>
            <Button href="/contact" variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              Get in Touch
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
