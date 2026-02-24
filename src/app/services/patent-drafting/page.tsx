import { Metadata } from "next";
import { CheckCircle2, Zap, Clock, Plus } from "lucide-react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import VideoEmbed from "@/components/ui/VideoEmbed";
import Accordion from "@/components/ui/Accordion";
import { getServiceBySlug, rushSurcharges } from "@/data/services";

const service = getServiceBySlug("patent-drafting")!;

export const metadata: Metadata = {
  title: `${service.title} | Alexander IP Consulting`,
  description: service.description,
};

const fullPackages = [
  {
    name: "Simple Full Package",
    price: "$1,970",
    items: [
      "Patent search ($375)",
      "Simple drafting ($995)",
      "Illustrations — created ($350)",
      "Filing / submission ($250)",
    ],
  },
  {
    name: "Mid-Tier Full Package",
    price: "$2,170",
    items: [
      "Patent search ($375)",
      "Mid-tier drafting ($1,195)",
      "Illustrations — created ($350)",
      "Filing / submission ($250)",
    ],
    popular: true,
  },
  {
    name: "Complex Full Package",
    price: "$2,370",
    items: [
      "Patent search ($375)",
      "Complex drafting ($1,395)",
      "Illustrations — created ($350)",
      "Filing / submission ($250)",
    ],
  },
];

export default function PatentDraftingPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6">Patent Drafting</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-tight mb-6">
                {service.title}
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                {service.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button href="/contact" size="lg">
                  Get Started
                </Button>
                <Button href="/services/patent-search" variant="outline" size="lg">
                  Add a Patent Search
                </Button>
              </div>
            </div>
            <VideoEmbed
              title="About Patent Drafting"
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
              Everything you need for a complete, professionally drafted patent
              application ready for filing.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {service.features.map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-3 bg-slate-50 rounded-lg p-4"
              >
                <CheckCircle2 className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">{feature}</span>
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
                <CheckCircle2 className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
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
              Drafting Pricing by Complexity
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Pricing is based on the technical complexity of your invention.
              Not sure which tier applies? Book a consultation and I&apos;ll
              advise.
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
                    <Badge variant="teal">Most Common</Badge>
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
                    <span>{service.delivery} delivery</span>
                  </div>
                </div>
                <div className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button
                  href="/contact"
                  variant={tier.popular ? "primary" : "outline"}
                  className="w-full"
                >
                  Get Started
                </Button>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Optional Extras */}
      <section className="py-20 bg-slate-50">
        <Container size="narrow">
          <div className="text-center mb-10">
            <div className="w-12 h-12 bg-teal/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 text-teal" />
            </div>
            <h2 className="text-3xl font-bold text-navy mb-4">
              Optional Extras
            </h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              The base drafting price covers the written application. Most
              clients add some or all of the following to their order.
            </p>
          </div>

          <Card padding="lg">
            <div className="space-y-0">
              {service.extras?.map((extra, i) => (
                <div
                  key={extra.name}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between py-4 ${
                    i < (service.extras?.length ?? 0) - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-navy">{extra.name}</div>
                    {extra.note && (
                      <p className="text-sm text-slate-500 mt-0.5">
                        {extra.note}
                      </p>
                    )}
                  </div>
                  <div className="text-lg font-bold text-teal mt-2 sm:mt-0 sm:ml-6">
                    {extra.price}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <p className="text-center text-sm text-slate-500 mt-6">
            Government patent office fees (e.g., ~$400 USPTO micro entity,
            ~&pound;325 UKIPO) are paid by you directly to the patent office and
            are not included above.
          </p>
        </Container>
      </section>

      {/* Full Package Pricing */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              Full Package Pricing
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Combine patent search, drafting, and filing into a single
              package. The search adds no additional time when bundled.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {fullPackages.map((pkg) => (
              <Card
                key={pkg.name}
                padding="lg"
                className={`flex flex-col ${
                  pkg.popular
                    ? "border-2 border-teal ring-1 ring-teal/20 relative"
                    : ""
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="teal">Best Value</Badge>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-navy mb-4">
                    {pkg.name}
                  </h3>
                  <div className="text-4xl font-bold text-navy">
                    {pkg.price}
                  </div>
                </div>
                <div className="space-y-3 mb-8 flex-1">
                  {pkg.items.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <Button
                  href="/contact"
                  variant={pkg.popular ? "primary" : "outline"}
                  className="w-full"
                >
                  Get Started
                </Button>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Rush Delivery */}
      <section className="py-20 bg-white">
        <Container size="narrow">
          <div className="text-center mb-10">
            <div className="w-12 h-12 bg-amber/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-amber-light" />
            </div>
            <h2 className="text-3xl font-bold text-navy mb-4">
              Rush Delivery Options
            </h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              Need your patent application faster? Rush delivery is available
              at the following surcharges on top of the base price.
            </p>
          </div>

          <Card padding="lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-navy">
                      Delivery Timeline
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-navy">
                      Surcharge
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 px-4 text-slate-600">
                      Standard (45 days)
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      No surcharge
                    </td>
                  </tr>
                  {rushSurcharges.map((rush) => (
                    <tr
                      key={rush.days}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-3 px-4 text-slate-600">
                        {rush.days} days
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-navy">
                        {rush.surcharge}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 mt-4 text-center">
              You must specify a target date when ordering rush delivery.
              &quot;ASAP&quot; is not accepted.
            </p>
          </Card>
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
              Ready to Protect Your Invention?
            </h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              Get a professionally drafted patent application ready for filing
              in any major jurisdiction. Fixed fee, no surprises.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/contact" size="lg">
                Get Started
              </Button>
              <Button href="/services/consultation" variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                Not Sure? Book a Consultation
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
