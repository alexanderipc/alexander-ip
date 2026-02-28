import { Metadata } from "next";
import { XCircle, ArrowLeft, Mail } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Booking Cancelled | Alexander IP Consulting",
  description: "Your booking was cancelled. No charges were made.",
  robots: { index: false, follow: false },
};

const SERVICE_BACK_LINKS: Record<string, { label: string; href: string }> = {
  consultation: { label: "Back to Consultation", href: "/services/consultation" },
  "patent-search-basic": { label: "Back to Patent Search", href: "/services/patent-search" },
  "patent-search-standard": { label: "Back to Patent Search", href: "/services/patent-search" },
  "patent-search-premium": { label: "Back to Patent Search", href: "/services/patent-search" },
  "patent-drafting-simple": { label: "Back to Patent Drafting", href: "/services/patent-drafting" },
  "patent-drafting-mid": { label: "Back to Patent Drafting", href: "/services/patent-drafting" },
  "patent-drafting-complex": { label: "Back to Patent Drafting", href: "/services/patent-drafting" },
  "fto-landscape": { label: "Back to FTO", href: "/services/fto" },
  "fto-simple": { label: "Back to FTO", href: "/services/fto" },
  "fto-complex": { label: "Back to FTO", href: "/services/fto" },
  custom: { label: "Back to Custom Project", href: "/services/custom" },
};

const DEFAULT_BACK = { label: "Back to Services", href: "/services" };

export default async function BookingCancelledPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  const backLink = (service && SERVICE_BACK_LINKS[service]) || DEFAULT_BACK;

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
            <Button href={backLink.href}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {backLink.label}
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
