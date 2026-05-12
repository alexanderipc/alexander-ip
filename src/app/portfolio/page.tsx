import type { Metadata } from "next";
import PatentMap from "@/components/home/PatentMap";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Patent Portfolio | Alexander IP",
  description:
    "Granted patents and published applications drafted by Alexander IP, spanning the US, UK, Europe, Canada, and 150+ PCT contracting states. Click any region to browse the underlying filings.",
  alternates: { canonical: "https://www.alexander-ip.com/portfolio" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Patent Portfolio — Alexander IP",
    description:
      "Granted patents and published applications drafted by Alexander IP across the US, UK, Europe, Canada, and 150+ PCT states.",
    url: "https://www.alexander-ip.com/portfolio",
    siteName: "Alexander IP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Patent Portfolio — Alexander IP",
    description:
      "Granted patents and published applications drafted by Alexander IP across the US, UK, Europe, Canada, and 150+ PCT states.",
  },
};

export default function PortfolioPage() {
  return (
    <>
      <PatentMap />

      {/* Light CTA below the map for shared-link visitors */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <Container size="narrow">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-3">
              Thinking about your own patent?
            </h2>
            <p className="text-lg text-slate-600 mb-6 max-w-xl mx-auto">
              I draft, prosecute, and file patents the way I&rsquo;d want
              it done for one of my own inventions — directly, with you,
              no juniors. Book a free 15-minute intro call or have a look
              at the drafting service.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button href="/book-call">Book a Free 15-min Call</Button>
              <Button href="/services/patent-drafting" variant="secondary">
                See Patent Drafting Service
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
