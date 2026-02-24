import { GraduationCap, User, ShieldCheck } from "lucide-react";
import Container from "@/components/ui/Container";

const differentiators = [
  {
    icon: GraduationCap,
    title: "Top-Tier Training, Accessible Pricing",
    description:
      "Trained at Kilburn & Strode LLP, a top-tier Legal 500 intellectual property firm. The same calibre of work traditionally reserved for large corporations, at a fraction of the cost.",
  },
  {
    icon: User,
    title: "Direct Personal Service",
    description:
      "Work directly with the expert handling your case. No handoffs to junior associates, no layers of management. One point of contact from start to finish.",
  },
  {
    icon: ShieldCheck,
    title: "Proven Global Track Record",
    description:
      "Hundreds of patents granted across the US, UK, Europe, and internationally. 800+ five-star reviews from individual inventors, startups, and established companies alike.",
  },
];

export default function WhyAlexanderIPC() {
  return (
    <section className="py-20 bg-slate-50">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
            Why Alexander IP?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            The patent industry doesn&apos;t cater well to startups and individual
            inventors. I exist to change that.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {differentiators.map((item) => (
            <div key={item.title} className="text-center">
              <div className="w-14 h-14 bg-navy rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <item.icon className="w-7 h-7 text-teal" />
              </div>
              <h3 className="text-xl font-semibold text-navy mb-3">
                {item.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
