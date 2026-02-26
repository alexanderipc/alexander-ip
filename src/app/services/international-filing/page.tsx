import { Metadata } from "next";
import { CheckCircle2, Globe, Clock, ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Accordion from "@/components/ui/Accordion";
import LocalizedPrice from "@/components/ui/LocalizedPrice";
import { getServiceBySlug } from "@/data/services";

const service = getServiceBySlug("international-filing")!;

const filingTierRange: Record<string, [number, number] | null> = {
  "PCT Filing": [600, 950],
  "National Phase Entry": null, // "Varies by jurisdiction" — no conversion
};

export const metadata: Metadata = {
  title: `${service.title} | Alexander IP Consulting`,
  description: service.description,
};

const pctSteps = [
  {
    step: "1",
    title: "File a PCT Application",
    description:
      "A single international application filed via WIPO gives you 'patent pending' status in over 150 countries. This buys you time to decide where to file nationally.",
  },
  {
    step: "2",
    title: "International Search & Examination",
    description:
      "An International Searching Authority (ISA) searches prior art and issues a written opinion on patentability. This gives early insight into your prospects globally.",
  },
  {
    step: "3",
    title: "National Phase Entry (30 months)",
    description:
      "At around 30 months from your earliest priority date, you choose which specific countries to enter. This is where costs scale, so strategic selection is critical.",
  },
];

export default function InternationalFilingPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <Container>
          <div className="max-w-3xl">
            <Badge className="mb-6">International Filing</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-tight mb-6">
              {service.title}
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              {service.description}
            </p>
            <Button href="/contact?service=international-filing" size="lg">
              Discuss International Filing
            </Button>
          </div>
        </Container>
      </section>

      {/* What's Included */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              What&apos;s Included
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Full support for extending your patent protection across
              international borders.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {service.features.map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-3 bg-slate-50 rounded-lg p-4"
              >
                <CheckCircle2 className="w-5 h-5 text-blue flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* How PCT Works */}
      <section className="py-20 bg-slate-50">
        <Container size="narrow">
          <div className="text-center mb-12">
            <div className="w-12 h-12 bg-blue/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-blue" />
            </div>
            <h2 className="text-3xl font-bold text-navy mb-4">
              How the PCT Route Works
            </h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              The Patent Cooperation Treaty (PCT) is the most cost-effective
              way to pursue international patent protection. Here&apos;s how it
              works.
            </p>
          </div>

          <div className="space-y-6">
            {pctSteps.map((item) => (
              <div
                key={item.step}
                className="flex gap-4 bg-white rounded-xl p-6 border border-slate-200"
              >
                <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-navy mb-1">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Card padding="md" className="bg-blue/5 border-blue/20">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-navy text-sm">
                    Important Deadline
                  </p>
                  <p className="text-slate-600 text-sm">
                    You generally have 12 months from your earliest filing
                    (priority date) to file a PCT application, and 30 months
                    from the priority date to enter the national phase in
                    individual countries. Planning ahead is crucial.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {/* Who Is This For? */}
      <section className="py-20 bg-white">
        <Container size="narrow">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              Who Is This For?
            </h2>
          </div>
          <div className="space-y-4">
            {service.whoIsItFor.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 bg-slate-50 rounded-lg p-4"
              >
                <CheckCircle2 className="w-5 h-5 text-blue flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-slate-50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">Pricing</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              International filing costs depend on the route and number of
              jurisdictions. Here are the main service components.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {service.pricing.map((tier) => (
              <Card key={tier.name} padding="lg" className="flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-navy mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {tier.description}
                  </p>
                  <div className="text-3xl font-bold text-navy">
                    {filingTierRange[tier.name] ? (
                      <LocalizedPrice range={filingTierRange[tier.name]!} fallback={tier.price} />
                    ) : (
                      tier.price
                    )}
                  </div>
                </div>
                <div className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button href="/contact?service=international-filing" variant="outline" className="w-full">
                  <span className="flex items-center gap-2">
                    Discuss Options <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-slate-400 mt-8 max-w-2xl mx-auto">
            Official fees (paid to patent offices) are separate and vary by
            jurisdiction. I&apos;ll provide a full cost breakdown before you
            commit.
          </p>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <Container size="narrow">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          <Accordion items={service.faq} />
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-navy to-navy-light">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Go Global?
            </h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              Whether you&apos;re filing a PCT application or entering national
              phase, I&apos;ll guide you through the process with strategic
              advice on country selection and cost optimisation.
            </p>
            <Button href="/contact?service=international-filing" size="lg">
              Discuss International Filing
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
