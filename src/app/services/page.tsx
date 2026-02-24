import { Metadata } from "next";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  FileText,
  Scale,
  Globe,
  TrendingUp,
  ArrowRight,
  Clock,
  Zap,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { services, rushSurcharges } from "@/data/services";

export const metadata: Metadata = {
  title: "Services & Pricing | Alexander IP Consulting",
  description:
    "Transparent, fixed-fee patent services: consultation, patent search, drafting, prosecution, international filing, and IP valuation. Professional quality at accessible prices.",
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  Search,
  FileText,
  Scale,
  Globe,
  TrendingUp,
};

const draftingTiers = [
  {
    name: "Simple Invention",
    price: "$995",
    description: "Mechanical inventions with few moving parts",
  },
  {
    name: "Mid-Tier Invention",
    price: "$1,195",
    description: "Electrical systems, moderate complexity",
    popular: true,
  },
  {
    name: "Complex Invention",
    price: "$1,395",
    description: "Software, AI, biochemistry, advanced systems",
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-6">Services & Pricing</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-tight mb-6">
              Professional Patent Services,
              <br />
              Transparent Pricing
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              Every service is offered at a fixed fee with no hidden costs.
              From initial consultation through to international filing, you
              always know exactly what you&apos;re paying.
            </p>
            <Button href="/contact">Get Started</Button>
          </div>
        </Container>
      </section>

      {/* All Services Grid */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              All Services
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Comprehensive patent services covering every stage of the IP
              lifecycle. Click any service for full details and pricing.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const IconComponent = iconMap[service.icon];
              return (
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="group"
                >
                  <Card hover padding="lg" className="h-full flex flex-col">
                    <div className="w-12 h-12 bg-teal/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal/20 transition-colors">
                      {IconComponent && (
                        <IconComponent className="w-6 h-6 text-teal" />
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
                        <span className="text-teal font-bold text-lg">
                          {service.startingPrice}
                        </span>
                        <span className="text-slate-400 text-sm ml-1">
                          starting
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 text-sm">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{service.delivery}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-3">
                      <span className="text-sm text-teal font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        View details
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Patent Drafting Pricing Table */}
      <section className="py-20 bg-slate-50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              Patent Drafting Pricing
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Base pricing by invention complexity. Most clients also add
              a patent search, illustrations, and filing — see the{" "}
              <Link href="/services/patent-drafting" className="text-teal hover:text-teal-dark underline">
                full pricing breakdown
              </Link>.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
                <h3 className="text-lg font-semibold text-navy mb-2">
                  {tier.name}
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  {tier.description}
                </p>
                <div className="text-3xl font-bold text-navy mb-6">
                  {tier.price}
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

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-navy to-navy-light">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Not Sure Which Service You Need?
            </h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              Get in touch with a brief description of your invention and
              I&apos;ll recommend the best path forward. No obligation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/contact" size="lg">
                Contact Me
              </Button>
              <Button href="/services/consultation" variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                Book a Consultation
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
