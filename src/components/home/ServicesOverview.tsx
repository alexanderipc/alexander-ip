import Link from "next/link";
import {
  MessageSquare,
  Search,
  FileText,
  Scale,
  Globe,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import LocalizedPrice from "@/components/ui/LocalizedPrice";

const serviceCards = [
  {
    icon: MessageSquare,
    title: "Consultation",
    description:
      "Not sure where to start? Alexander IP will assess your idea, explain what patent protection involves, and help you decide whether it makes sense to proceed.",
    usdAmount: 125,
    href: "/services/consultation",
  },
  {
    icon: Search,
    title: "Patent Search",
    description:
      "A thorough search of existing patents and publications to assess patentability before investing in a full application.",
    usdAmount: 335,
    href: "/services/patent-search",
  },
  {
    icon: FileText,
    title: "Patent Drafting",
    description:
      "A complete patent application — background, claims, detailed description, and abstract — drafted to maximise protection and ready for filing.",
    usdAmount: 995,
    href: "/services/patent-drafting",
  },
  {
    icon: Scale,
    title: "Correspondence",
    description:
      "Strategic handling of patent office correspondence — examiner objections, claim amendments, and appeals — to get your patent granted.",
    priceLabel: "Quoted per case",
    href: "/services/patent-prosecution",
  },
  {
    icon: Globe,
    title: "International Filing",
    description:
      "PCT applications and national phase entries to extend protection to other countries, with clear advice on where it's worth filing.",
    usdAmount: 600,
    href: "/services/international-filing",
  },
  {
    icon: ShieldCheck,
    title: "FTO / Infringement",
    description:
      "Honest, understandable strategic advice on the risks of selling and manufacturing your product, backed by in-depth patent research.",
    usdAmount: 600,
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
            Most clients start with a consultation or search, then move to
            drafting and filing, and come back for office correspondence when the patent
            office responds. Every service has a clear, fixed fee &mdash; no
            hidden costs, no hourly billing.
          </p>
        </div>

        {/* Typical journey hint */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-10">
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviceCards.map((service) => (
            <Link key={service.href} href={service.href} className="group">
              <Card hover padding="lg" className="h-full flex flex-col">
                <div className="w-12 h-12 bg-blue/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue/20 transition-colors">
                  <service.icon className="w-6 h-6 text-blue" />
                </div>
                <h3 className="text-xl font-semibold text-navy mb-2">
                  {service.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                  {service.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-blue font-bold">
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
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
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
