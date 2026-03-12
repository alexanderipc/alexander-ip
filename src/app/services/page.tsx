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
  AlertCircle,
  HelpCircle,
  Wrench,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LocalizedPrice from "@/components/ui/LocalizedPrice";
import PackageBuilderSection from "@/components/home/PackageBuilderSection";
import { services } from "@/data/services";

export const metadata: Metadata = {
  title: "Services & Pricing | Alexander IP",
  description:
    "Transparent, fixed-fee patent services from a Legal 500-trained specialist. Consultation, search, drafting, office correspondence, international filing, and infringement analysis. No hidden costs.",
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
  consultation: 112,
  "patent-search": 300,
  "patent-drafting": 895,
  "patent-prosecution": null,
  "international-filing": 540,
  fto: 540,
};

const notOffered = [
  "Trademark registration",
  "Copyright services",
  "Legal disputes or litigation",
  "Design patents as a standalone service",
];

function ServicesSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Patent Services by Alexander IP",
    itemListElement: services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.title,
        description: s.description,
        url: `https://www.alexander-ip.com/services/${s.slug}`,
        provider: { "@type": "Organization", name: "Alexander IP" },
        ...(s.startingPrice !== "Quote"
          ? {
              offers: {
                "@type": "Offer",
                price: s.startingPrice.replace(/[^0-9.]/g, ""),
                priceCurrency: "USD",
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: s.startingPrice.replace(/[^0-9.]/g, ""),
                  priceCurrency: "USD",
                  unitText: "per project",
                },
              },
            }
          : {}),
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function ServicesPage() {
  return (
    <>
      <ServicesSchema />
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
              to drafting and filing, and come back for office correspondence when the
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
            <span>Correspond</span>
            <ArrowRight className="w-3 h-3" />
            <span className="font-semibold text-navy">Grant</span>
          </div>
        </Container>
      </section>

      {/* Build Your Patent Package — top of page */}
      <PackageBuilderSection />

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
