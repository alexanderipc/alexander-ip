import { DollarSign, Zap, CreditCard, Handshake } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

const benefits = [
  {
    icon: DollarSign,
    title: "Better Value",
    description:
      "No platform commission means potential savings passed on to you.",
  },
  {
    icon: Zap,
    title: "Faster Communication",
    description:
      "Direct email and calls without platform message monitoring or restrictions.",
  },
  {
    icon: CreditCard,
    title: "Flexible Payment",
    description:
      "Pay by card (Stripe) or bank transfer. Structured milestone payments for larger projects.",
  },
  {
    icon: Handshake,
    title: "Same Expert, Direct Relationship",
    description:
      "The exact same person and quality of work. Just without the middleman.",
  },
];

export default function WhyWorkDirect() {
  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="bg-gradient-to-br from-navy to-navy-light rounded-2xl p-8 md:p-12 lg:p-16">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Already know me from Fiverr?
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Many of my clients start on Fiverr and transition to working
              directly. The quality is identical — it&apos;s the same person doing the
              same work. Here&apos;s why direct is worth considering.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="flex gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10"
              >
                <div className="w-10 h-10 bg-teal/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-teal-light" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-slate-400">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button href="/contact" variant="primary" size="lg">
              Work With Me Directly
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
