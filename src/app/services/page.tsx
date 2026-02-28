import { Metadata } from "next";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  FileText,
  Scale,
  Globe,
  ShieldCheck,
  ArrowRight,
  Clock,
  Zap,
  AlertCircle,
  HelpCircle,
  Wrench,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LocalizedPrice from "@/components/ui/LocalizedPrice";
import { services, rushSurcharges } from "@/data/services";

export const metadata: Metadata = {
  title: "Services & Pricing | Alexander IP",
  description:
    "Transparent, fixed-fee patent services from a Legal 500-trained specialist. Consultation, search, drafting, prosecution, international filing, and FTO analysis. No hidden costs.",
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  Search,
  FileText,
  Scale,
  Globe,
  ShieldCheck,
};

const startingPriceUsd: Record<string, number | null> = {
  consultation: 125,
  "patent-search": 335,
  "patent-drafting": 995,
  "patent-prosecution": null,
  "international-filing": 600,
  fto: 600,
};

const draftingTiers = [
  {
    name: "Simple Invention",
    usd: 995,
    description: "Physical products with straightforward mechanics — tools, accessories, furniture, simple devices. Fewer than roughly 10 functional components.",
  },
  {
    name: "Standard Invention",
    usd: 1195,
    description: "Electrical systems, multi-component mechanisms, consumer electronics, medical devices. Moderate technical complexity.",
    popular: true,
  },
  {
    name: "Complex Invention",
    usd: 1395,
    description: "Software-implemented inventions, AI/ML systems, biotech, chemical compositions, telecommunications. Requires detailed technical specification.",
  },
];

const rushUsd: Record<number, number> = { 30: 200, 21: 400, 14: 700 };

const notOffered = [
  "Trademark registration",
  "Copyright services",
  "Legal disputes or litigation",
  "Design patents as a standalone service",
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-6">Services &amp; Pricing</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-tight mb-6">
              Clear pricing, no surprises.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-4">
              Every service has a fixed fee &mdash; no hourly billing, no hidden
              costs. Most clients start with a consultation or search, then move
              to drafting and filing, and come back for prosecution when the
              patent office responds.
            </p>
            <p className="text-slate-500 mb-8">
              Not sure what you need? Describe your invention briefly and
              Alexander IP will advise &mdash; no charge, no obligation.
            </p>
            <Button href="/contact">Tell Me About Your Invention</Button>
          </div>
        </Container>
      </section>

      {/* Typical journey */}
      <section className="py-6 bg-white border-b border-slate-100">
        <Container>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
            <span className="bg-blue/10 text-blue-dark rounded-full px-3 py-1 font-medium">
              Typical path:
            </span>
            <span>Consultation</span>
            <ArrowRight className="w-3 h-3" />
            <span>Search</span>
            <ArrowRight className="w-3 h-3" />
            <span>Draft</span>
            <ArrowRight className="w-3 h-3" />
            <span>File</span>
            <ArrowRight className="w-3 h-3" />
            <span>Prosecute</span>
            <ArrowRight className="w-3 h-3" />
            <span className="font-semibold text-navy">Grant</span>
          </div>
        </Container>
      </section>

      {/* All Services */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              All Services
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Alexander IP handles every stage of the patent lifecycle
              personally. Click any service for full details.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const IconComponent = iconMap[service.icon];
              const usd = startingPriceUsd[service.slug];
              return (
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="group"
                >
                  <Card hover padding="lg" className="h-full flex flex-col">
                    <div className="w-12 h-12 bg-blue/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue/20 transition-colors">
                      {IconComponent && (
                        <IconComponent className="w-6 h-6 text-blue" />
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-navy mb-2">
                      {service.shortTitle}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div>
                        {usd != null ? (
                          <>
                            <span className="text-blue font-bold text-lg">
                              <LocalizedPrice
                                amount={usd}
                                fallback={service.startingPrice}
                              />
                            </span>
                            <span className="text-slate-400 text-sm ml-1">
                              starting
                            </span>
                          </>
                        ) : (
                          <span className="text-blue font-bold text-lg">
                            {service.startingPrice}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 text-sm">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{service.delivery}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-3">
                      <span className="text-sm text-blue font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        View details
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Custom project CTA */}
          <Link href="/services/custom" className="group block mt-8">
            <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue/30 hover:shadow-md transition-all">
              <div className="flex-shrink-0 w-12 h-12 bg-blue/10 rounded-lg flex items-center justify-center group-hover:bg-blue/20 transition-colors">
                <Wrench className="w-6 h-6 text-blue" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-navy">
                  Custom Project
                </h3>
                <p className="text-slate-500 text-sm">
                  Been quoted a custom price? Set your amount and describe
                  your project to get started.
                </p>
              </div>
              <span className="hidden sm:flex items-center gap-1 text-sm text-blue font-medium group-hover:gap-2 transition-all">
                Get started
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        </Container>
      </section>

      {/* Complexity guide + Drafting pricing */}
      <section className="py-20 bg-slate-50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              Patent Drafting Pricing by Complexity
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Pricing depends on the technical complexity of your invention. Not
              sure where yours falls? Describe it briefly in your enquiry and
              Alexander IP will let you know &mdash; no charge, no obligation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
            {draftingTiers.map((tier) => (
              <Card
                key={tier.name}
                padding="lg"
                className={`text-center ${
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
                <h3 className="text-lg font-semibold text-navy mb-3">
                  {tier.name}
                </h3>
                <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                  {tier.description}
                </p>
                <div className="text-3xl font-bold text-navy mb-6">
                  <LocalizedPrice
                    amount={tier.usd}
                    fallback={`$${tier.usd.toLocaleString()}`}
                  />
                </div>
                <Button
                  href="/services/patent-drafting"
                  variant={tier.popular ? "primary" : "outline"}
                  size="sm"
                  className="w-full"
                >
                  Learn More
                </Button>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500 max-w-xl mx-auto">
            Most clients also add a patent search, illustrations, and filing.
            See the{" "}
            <Link
              href="/services/patent-drafting"
              className="text-blue hover:text-blue-dark underline"
            >
              full pricing breakdown
            </Link>{" "}
            for package options and add-ons.
          </p>
        </Container>
      </section>

      {/* Rush Surcharges */}
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
              for patent drafting at the following surcharges.
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
                          <>
                            <span>+</span>
                            <LocalizedPrice
                              amount={rushUsd[rush.days]}
                              fallback={rush.surcharge}
                            />
                          </>
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

      {/* What's not offered */}
      <section className="py-12 bg-slate-50">
        <Container size="narrow">
          <div className="flex gap-4 items-start bg-white border border-slate-200 rounded-xl p-6">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <h3 className="font-semibold text-navy mb-2">
                Services not offered
              </h3>
              <p className="text-sm text-slate-600 mb-3">
                Alexander IP specialises in utility patent work. The following
                are not offered, but recommendations to specialists can be
                provided on request:
              </p>
              <ul className="text-sm text-slate-500 space-y-1">
                {notOffered.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-slate-400 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-navy to-navy-light">
        <Container>
          <div className="text-center">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Not sure which service you need?
            </h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              Describe your invention briefly and Alexander IP will recommend
              the best path forward. No obligation, no charge for the initial
              advice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/contact" size="lg">
                Get in Touch
              </Button>
              <Button
                href="/services/consultation"
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                Book a Consultation
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
