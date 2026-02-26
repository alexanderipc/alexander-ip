import { DollarSign, Zap, CreditCard, Handshake } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

const benefits = [
  {
    icon: DollarSign,
    title: "Real Savings for Both Sides",
    description:
      "Fiverr takes a 20% commission on every order. Working directly means that overhead disappears — savings we pass on to you.",
  },
  {
    icon: Zap,
    title: "Faster, Unrestricted Communication",
    description:
      "Direct email and calls with no platform monitoring, no message restrictions, and no delays waiting for a platform to relay things.",
  },
  {
    icon: CreditCard,
    title: "Flexible Payment Options",
    description:
      "Pay by card (Stripe) or bank transfer. For larger projects, we offer structured milestone payments so you\u2019re never paying for work that hasn\u2019t been done.",
  },
  {
    icon: Handshake,
    title: "Same Team, Same Quality",
    description:
      "Nothing changes about the work itself. You get the exact same expertise and the exact same quality \u2014 just without the middleman.",
  },
];

export default function WhyWorkDirect() {
  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="bg-gradient-to-br from-navy to-navy-light rounded-2xl p-8 md:p-12 lg:p-16">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Already know us from Fiverr?
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Many of our clients find Alexander IP on Fiverr first. For future
              work, you&apos;re welcome to reach out directly &mdash; same
              service, same quality, and more flexible timelines and pricing
              for returning clients.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="flex gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10"
              >
                <div className="w-10 h-10 bg-blue/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-blue-light" />
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
              Work With Us Directly
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
