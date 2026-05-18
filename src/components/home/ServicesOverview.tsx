import Link from "next/link";
import {
  MessageSquare,
  Search,
  FileText,
  Scale,
  Globe,
  ShieldCheck,
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
    title: "International Filing",
    usdAmount: 540,
    href: "/services/international-filing",
  },
  {
    icon: ShieldCheck,
    title: "Infringement Check",
    usdAmount: 540,
    href: "/services/fto",
  },
];

export default function ServicesOverview() {
  return (
    <section className="pt-10 pb-6 bg-white">
      <Container>
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-3">
            Or buy a service in isolation
          </h2>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">
            If you just want one specific service &mdash; consultation, search,
            drafting, correspondence, filing, or an infringement check &mdash;
            go straight to it. Same fixed fees, no package required.
          </p>
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
      </Container>
    </section>
  );
}
