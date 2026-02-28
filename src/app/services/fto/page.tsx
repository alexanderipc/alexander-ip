import { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import CheckoutButton from "@/components/ui/CheckoutButton";
import Card from "@/components/ui/Card";
import Accordion from "@/components/ui/Accordion";
import LocalizedPrice from "@/components/ui/LocalizedPrice";
import { getServiceBySlug } from "@/data/services";

const service = getServiceBySlug("fto")!;

const ftoTierUsd: Record<string, number> = {
  "Patent Landscape": 600,
  "Simple Invention FTO": 1600,
  "Complex Invention FTO": 2500,
};

const ftoTierService: Record<string, string> = {
  "Patent Landscape": "fto-landscape",
  "Simple Invention FTO": "fto-simple",
  "Complex Invention FTO": "fto-complex",
};

export const metadata: Metadata = {
  title: `${service.title} | Alexander IP Consulting`,
  description: service.description,
};

export default function FTOPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <Container>
          <div className="max-w-3xl">
            <Badge className="mb-6">FTO / Infringement Check</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-tight mb-6">
              {service.title}
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              {service.longDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <CheckoutButton
                service="fto-simple"
                size="lg"
                label="Order Simple FTO"
              />
              <Button
                href="/contact?service=fto"
                variant="outline"
                size="lg"
              >
                Get in Touch First
              </Button>
            </div>
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
              In-depth research and analysis to give you a clear picture
              of your infringement risk.
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

      {/* Pricing — 3 Tiers */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              FTO Packages
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Three tiers depending on the depth of analysis your product
              requires.
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
                  <div className="md:absolute md:-top-3 md:left-1/2 md:-translate-x-1/2 mb-3 md:mb-0 text-center">
                    <Badge variant="teal">Most Popular</Badge>
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
                    <LocalizedPrice
                      amount={ftoTierUsd[tier.name]}
                      fallback={tier.price}
                    />
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
                <CheckoutButton
                  service={ftoTierService[tier.name]}
                  size="md"
                  label={`Order ${tier.name}`}
                  className="w-full"
                />
              </Card>
            ))}
          </div>
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
              Ready to Check Your Freedom to Operate?
            </h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              Don&apos;t invest in production without understanding your
              patent risk. Get a clear, honest assessment before you commit.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <CheckoutButton
                service="fto-simple"
                size="lg"
                label="Order Simple FTO"
              />
              <Button
                href="/contact?service=fto"
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                Get in Touch First
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
