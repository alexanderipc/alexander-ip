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
  consultation: { label: "Resume Booking", href: "/services/consultation" },
  "patent-search-basic": { label: "Resume Your Order", href: "/services/patent-search#build-package" },
  "patent-search-standard": { label: "Resume Your Order", href: "/services/patent-search#build-package" },
  "patent-search-premium": { label: "Resume Your Order", href: "/services/patent-search#build-package" },
  "patent-drafting-simple": { label: "Resume Your Package", href: "/services/patent-drafting#build-package" },
  "patent-drafting-mid": { label: "Resume Your Package", href: "/services/patent-drafting#build-package" },
  "patent-drafting-complex": { label: "Resume Your Package", href: "/services/patent-drafting#build-package" },
  "fto-landscape": { label: "Resume Your Order", href: "/services/fto" },
  "fto-simple": { label: "Resume Your Order", href: "/services/fto" },
  "fto-complex": { label: "Resume Your Order", href: "/services/fto" },
  custom: { label: "Resume Your Order", href: "/services/custom" },
};

const DEFAULT_BACK = { label: "Back to Services", href: "/services" };

/* Only allow internal paths to known builder pages — never trust query params verbatim */
const ALLOWED_BUILDER_PATHS = new Set([
  "/services/patent-drafting",
  "/",
]);

interface CancelSearchParams {
  service?: string;
  /** Builder package config: complexity / extras (comma-separated keys) / timeline */
  c?: string;
  e?: string;
  t?: string;
  /** Path of the builder the user came from (validated against ALLOWED_BUILDER_PATHS) */
  from?: string;
}

export default async function BookingCancelledPage({
  searchParams,
}: {
  searchParams: Promise<CancelSearchParams>;
}) {
  const { service, c, e, t, from } = await searchParams;

  /* If a complexity param is present, the buyer came from the package builder
     and we have enough state to offer one-click resume. */
  const hasPackage = Boolean(c);
  let backLink: { label: string; href: string };

  if (hasPackage) {
    const builderPath =
      from && ALLOWED_BUILDER_PATHS.has(from) ? from : "/services/patent-drafting";
    const params = new URLSearchParams();
    if (c) params.set("c", c);
    if (e) params.set("e", e);
    if (t) params.set("t", t);
    backLink = {
      label: "Resume Your Package",
      href: `${builderPath}?${params.toString()}#build-package`,
    };
  } else {
    backLink = (service && SERVICE_BACK_LINKS[service]) || DEFAULT_BACK;
  }

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white">
      <Container size="narrow">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-slate-400" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
            {hasPackage
              ? "Your Package Has Been Saved"
              : "No Charge — Pick Up Where You Left Off"}
          </h1>

          <p className="text-lg text-slate-600 mb-6 max-w-lg mx-auto">
            {hasPackage ? (
              <>
                Your card hasn&rsquo;t been charged and your selections are
                still there. Click below to drop straight back into the
                builder &mdash; everything you configured will be pre-filled.
              </>
            ) : (
              <>
                Your card hasn&rsquo;t been charged. If you got cold feet or
                hit a snag, here are your options &mdash; no pressure either
                way.
              </>
            )}
          </p>

          {hasPackage && (
            <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm">
              Want to come back to it later instead? Use the{" "}
              <em>Email me this quote</em> button on the builder &mdash;
              you&rsquo;ll get a one-click resume link by email.
            </p>
          )}

          <p className="text-slate-500 mb-10 max-w-md mx-auto">
            Have a question first? Reply directly to{" "}
            <a
              href="mailto:alexanderip.contact@gmail.com"
              className="text-blue hover:text-blue-dark"
            >
              alexanderip.contact@gmail.com
            </a>{" "}
            and I&rsquo;ll personally get back to you within a business day.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href={backLink.href}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {backLink.label}
            </Button>
            <Button href="/contact" variant="outline">
              <Mail className="w-4 h-4 mr-2" />
              Enquire First — No Obligation
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
