import { Metadata } from "next";
import { CheckCircle2, Clock } from "lucide-react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import VideoEmbed from "@/components/ui/VideoEmbed";
import Accordion from "@/components/ui/Accordion";
import { getServiceBySlug } from "@/data/services";

const service = getServiceBySlug("ip-valuation")!;

export const metadata: Metadata = {
  title: `${service.title} | Alexander IP Consulting`,
  description: service.description,
};

const deliveryTimelines: Record<string, string> = {
  Basic: "25 days",
  "Mid-Tier": "30 days",
  Full: "35 days",
};

export default function IPValuationPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6">IP Valuation</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-tight mb-6">
                {service.title}
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                {service.description}
              </p>
              <Button href="/contact" size="lg">
                Request a Valuation
              </Button>
            </div>
            <VideoEmbed
              title="About IP Valuation"
              subtitle="Service overview video coming soon"
            />
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
              Professional portfolio analysis and valuation to support your
              business decisions, investor presentations, or strategic
              planning.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {service.features.map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-3 bg-slate-50 rounded-lg p-4"
              >
                <CheckCircle2 className="w-5 h-5 text-blue flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Who Is This For? */}
      <section className="py-20 bg-slate-50">
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
                className="flex items-start gap-3 bg-white rounded-lg p-4 border border-slate-200"
              >
                <CheckCircle2 className="w-5 h-5 text-blue flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing Tiers */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              Valuation Tiers
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Three levels of depth depending on your needs &mdash; from a
              high-level ecosystem view to granular per-patent valuations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {service.pricing.map((tier) => (
              <Card
                key={tier.name}
                padding="lg"
                className={`flex flex-col ${
                  tier.popular
                    ? "border-2 border-teal ring-1 ring-teal/20 relative"
                    : ""
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="teal">Recommended</Badge>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-navy mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {tier.description}
                  </p>
                  <div className="text-4xl font-bold text-navy">
                    {tier.price}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-sm text-slate-400 mt-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {deliveryTimelines[tier.name] || service.delivery}{" "}
                      delivery
                    </span>
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
                <Button
                  href="/contact"
                  variant={tier.popular ? "primary" : "outline"}
                  className="w-full"
                >
                  Request Valuation
                </Button>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-slate-400 mt-8 max-w-2xl mx-auto">
            Investor-facing versions with appropriate positive positioning can
            be prepared as a separate deliverable. Contact me for details.
          </p>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
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
              Know the Value of Your IP
            </h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              Whether you&apos;re raising investment, planning strategy, or
              making acquisition decisions, get a professional assessment of
              your patent portfolio&apos;s value.
            </p>
            <Button href="/contact" size="lg">
              Request a Valuation
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
