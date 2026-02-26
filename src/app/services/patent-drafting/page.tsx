import { Metadata } from "next";
import { CheckCircle2, Zap, Clock, Plus, ChevronDown } from "lucide-react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import CheckoutButton from "@/components/ui/CheckoutButton";
import Card from "@/components/ui/Card";
import Accordion from "@/components/ui/Accordion";
import LocalizedPrice from "@/components/ui/LocalizedPrice";
import { getServiceBySlug, rushSurcharges } from "@/data/services";

const service = getServiceBySlug("patent-drafting")!;

export const metadata: Metadata = {
  title: `${service.title} | Alexander IP`,
  description: service.description,
};

const fullPackages = [
  {
    name: "Simple Full Package",
    usd: 1970,
    items: [
      { label: "Patent search", usd: 375 },
      { label: "Simple drafting", usd: 995 },
      { label: "Illustrations — created", usd: 350 },
      { label: "Filing / submission", usd: 250 },
    ],
  },
  {
    name: "Mid-Tier Full Package",
    usd: 2170,
    items: [
      { label: "Patent search", usd: 375 },
      { label: "Mid-tier drafting", usd: 1195 },
      { label: "Illustrations — created", usd: 350 },
      { label: "Filing / submission", usd: 250 },
    ],
    popular: true,
  },
  {
    name: "Complex Full Package",
    usd: 2370,
    items: [
      { label: "Patent search", usd: 375 },
      { label: "Complex drafting", usd: 1395 },
      { label: "Illustrations — created", usd: 350 },
      { label: "Filing / submission", usd: 250 },
    ],
  },
];

const draftingTierUsd: Record<string, number> = {
  "Simple Invention": 995,
  "Mid-Tier Invention": 1195,
  "Complex Invention": 1395,
};

const extraUsd: Record<string, number> = {
  "Patent Search": 375,
  "Patent Illustrations (created by Alexander IP)": 350,
  "Patent Illustrations (client-provided, formatted)": 50,
  "Patent Filing / Submission": 250,
};

const rushUsd: Record<number, number> = { 30: 200, 21: 400, 14: 700 };

const draftingTierService: Record<string, string> = {
  "Simple Invention": "patent-drafting-simple",
  "Mid-Tier Invention": "patent-drafting-mid",
  "Complex Invention": "patent-drafting-complex",
};

export default function PatentDraftingPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <Container>
          <div className="max-w-3xl">
            <Badge className="mb-6">Patent Drafting</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-tight mb-6">
              {service.title}
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              {service.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <CheckoutButton service="patent-drafting-mid" size="lg" label="Order Mid-Tier Drafting" />
              <Button href="/services/patent-search" variant="outline" size="lg">
                Add a Patent Search
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
                <CheckCircle2 className="w-5 h-5 text-blue flex-shrink-0 mt-0.5" />
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
              Drafting Pricing by Complexity
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Pricing is based on the technical complexity of your invention.
              Not sure which tier applies? Describe it briefly in your enquiry
              and Alexander IP will advise &mdash; no charge, no obligation.
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
                    <LocalizedPrice amount={draftingTierUsd[tier.name]} fallback={tier.price} />
                  </div>
                  <div className="flex items-center justify-center gap-1 text-sm text-slate-400 mt-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{service.delivery} delivery</span>
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
                  service={draftingTierService[tier.name]}
                  size="md"
                  label={`Order ${tier.name.split(" ")[0]}`}
                  className="w-full"
                />
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Optional Extras */}
      <section className="py-20 bg-slate-50">
        <Container size="narrow">
          <div className="text-center mb-10">
            <div className="w-12 h-12 bg-blue/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6 text-blue" />
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
                  <div className="text-lg font-bold text-blue mt-2 sm:mt-0 sm:ml-6">
                    <LocalizedPrice amount={extraUsd[extra.name]} fallback={extra.price} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <p className="text-center text-sm text-slate-500 mt-6">
            Government patent office fees are paid by you directly to the patent
            office and are not included above.
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
                    <LocalizedPrice amount={pkg.usd} fallback={`$${pkg.usd.toLocaleString()}`} />
                  </div>
                </div>
                <div className="space-y-3 mb-8 flex-1">
                  {pkg.items.map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600 text-sm">
                        {item.label} (<LocalizedPrice amount={item.usd} fallback={`$${item.usd.toLocaleString()}`} />)
                      </span>
                    </div>
                  ))}
                </div>
                <Button
                  href="/contact?service=patent-drafting"
                  variant={pkg.popular ? "primary" : "outline"}
                  className="w-full"
                >
                  Order Full Package
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
                        {rushUsd[rush.days] ? (
                          <>+<LocalizedPrice amount={rushUsd[rush.days]} fallback={rush.surcharge} /></>
                        ) : (
                          rush.surcharge
                        )}
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

      {/* Why does this cost so much less? */}
      <section className="py-12 bg-slate-50">
        <Container size="narrow">
          <Accordion
            items={[
              {
                question:
                  "Why does this cost so much less than a traditional patent firm?",
                answer:
                  "A typical patent attorney firm charges $8,000\u2013$15,000 for a single utility patent application. That price reflects central city offices, partner profit margins, layers of administration, and the overhead of running a large organisation. The work often passes through multiple hands \u2014 a junior associate drafts, a senior associate reviews, a partner signs off. You\u2019re paying for the hierarchy, the building, and the brand name. At Alexander IP, the specialist who understands your invention is the same person who drafts your claims, responds to office actions, and advises on strategy. There are no handoffs, no juniors, no middlemen. The quality comes from rigorous Legal 500 training and 10 years of high-volume practice. The lower pricing comes from a business model with virtually zero overhead \u2014 not from cutting corners on the work itself.",
              },
            ]}
          />
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
              Ready to get started?
            </h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              A professionally drafted patent application, ready for filing in
              any major jurisdiction. Fixed fee, no surprises.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <CheckoutButton service="patent-drafting-mid" size="lg" label="Order Mid-Tier Drafting" />
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
