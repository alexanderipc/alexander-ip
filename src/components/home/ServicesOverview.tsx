import Link from "next/link";
import {
  MessageSquare,
  Search,
  FileText,
  Scale,
  Globe,
  TrendingUp,
} from "lucide-react";
import { ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";

const serviceCards = [
  {
    icon: MessageSquare,
    title: "Consultation",
    description: "Not sure where to start? I'll assess your idea, explain what patent protection involves, and help you decide if it makes sense to proceed.",
    price: "From $125",
    href: "/services/consultation",
  },
  {
    icon: Search,
    title: "Patent Search",
    description: "A thorough search of existing patents and publications to see what's already out there — so you know what you're up against before investing in a full application.",
    price: "From $335",
    href: "/services/patent-search",
  },
  {
    icon: FileText,
    title: "Patent Drafting",
    description:
      "A complete patent application, drafted to maximise your protection and ready for filing in any major jurisdiction.",
    price: "From $995",
    href: "/services/patent-drafting",
  },
  {
    icon: Scale,
    title: "Prosecution",
    description:
      "When the patent office pushes back, I prepare strategic responses to objections and rejections to get your patent granted.",
    price: "From $450",
    href: "/services/patent-prosecution",
  },
  {
    icon: Globe,
    title: "International Filing",
    description: "PCT applications and national phase entries to extend your protection to other countries — I'll help you decide where it's worth filing.",
    price: "From $600",
    href: "/services/international-filing",
  },
  {
    icon: TrendingUp,
    title: "IP Valuation",
    description:
      "A formal valuation of your patent portfolio — useful for investment rounds, licensing negotiations, or strategic planning.",
    price: "From $2,250",
    href: "/services/ip-valuation",
  },
];

export default function ServicesOverview() {
  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
            Services &amp; Pricing
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need from first idea to granted patent. Transparent
            pricing — no hidden fees, no surprises.
          </p>
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
                  <span className="text-blue font-bold">{service.price}</span>
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
