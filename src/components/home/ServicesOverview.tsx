import Link from "next/link";
import {
  MessageSquare,
  Search,
  FileText,
  Scale,
  Globe,
  ShieldCheck,
  ArrowRight,
  ArrowDown,
} from "lucide-react";
import Container from "@/components/ui/Container";
import LocalizedPrice from "@/components/ui/LocalizedPrice";

const serviceCards = [
  {
    icon: MessageSquare,
    title: "Consultation",
    usdAmount: 112,
    href: "/services/consultation",
  },
  {
    icon: Search,
    title: "Patent Search",
    usdAmount: 300,
    href: "/services/patent-search",
  },
  {
    icon: FileText,
    title: "Patent Drafting",
    usdAmount: 895,
    href: "/services/patent-drafting",
    featured: true,
  },
  {
    icon: Scale,
    title: "Correspondence",
    priceLabel: "Quoted",
    href: "/services/patent-prosecution",
  },
  {
    icon: Globe,
    title: "Intl. Filing",
    usdAmount: 540,
    href: "/services/international-filing",
  },
  {
    icon: ShieldCheck,
    title: "FTO",
    usdAmount: 540,
    href: "/services/fto",
  },
];

export default function ServicesOverview() {
  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="text-center mb-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
            Services &amp; Pricing
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Every service has a clear, fixed fee &mdash; no hidden costs, no
            hourly billing. Most clients start with a search, then move to
            drafting.
          </p>
        </div>

        {/* Typical journey hint */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-10 flex-wrap">
          <span className="bg-blue/10 text-blue-dark rounded-full px-3 py-1 font-medium">
            Typical path:
          </span>
          <span>Search</span>
          <ArrowRight className="w-3 h-3" />
          <span>Draft</span>
          <ArrowRight className="w-3 h-3" />
          <span>File</span>
          <ArrowRight className="w-3 h-3" />
          <span>Correspond</span>
          <ArrowRight className="w-3 h-3" />
          <span>Grant</span>
        </div>

        {/* Compact service cards row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {serviceCards.map((service) => (
            <Link key={service.href} href={service.href} className="group">
              <div
                className={`text-center p-4 rounded-xl border-2 transition-all duration-200 h-full flex flex-col items-center ${
                  service.featured
                    ? "border-teal bg-teal/5 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                    service.featured
                      ? "bg-teal/10"
                      : "bg-blue/10 group-hover:bg-blue/20"
                  }`}
                >
                  <service.icon
                    className={`w-5 h-5 ${
                      service.featured ? "text-teal" : "text-blue"
                    }`}
                  />
                </div>
                <h3 className="text-sm font-semibold text-navy mb-1">
                  {service.title}
                </h3>
                <span className="text-xs text-blue font-medium">
                  {service.priceLabel ? (
                    service.priceLabel
                  ) : (
                    <LocalizedPrice
                      amount={service.usdAmount!}
                      prefix="From"
                      fallback={`From $${service.usdAmount!.toLocaleString()}`}
                    />
                  )}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Arrow pointing down to PackageBuilder */}
        <div className="flex flex-col items-center mt-8 text-slate-400">
          <span className="text-sm mb-2">
            Configure your patent drafting package below
          </span>
          <ArrowDown className="w-5 h-5 animate-bounce" />
        </div>

        <div className="text-center mt-6">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-blue font-semibold hover:text-blue-dark transition-colors"
          >
            View all services with full pricing
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
