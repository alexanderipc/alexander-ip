import { Metadata } from "next";
import { DollarSign, Zap, CreditCard, Handshake, ExternalLink } from "lucide-react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Returning Clients | Alexander IP",
  description:
    "Already know Alexander IP from Fiverr? Work directly for lower costs, faster communication, and flexible payment options. Same expertise, same quality.",
};

const benefits = [
  {
    icon: DollarSign,
    title: "Real Savings for Both Sides",
    description:
      "Fiverr takes a 20% commission on every order. Working directly means that overhead disappears \u2014 savings that get passed on to you.",
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
      "Pay by card (Stripe) or bank transfer. For larger projects, structured milestone payments are available so you\u2019re never paying for work that hasn\u2019t been done.",
  },
  {
    icon: Handshake,
    title: "Same Specialist, Same Quality",
    description:
      "Nothing changes about the work itself. You get the exact same expertise, the exact same specialist, and the exact same quality \u2014 just without the middleman.",
  },
];

export default function ReturningClientsPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-6">Returning Clients</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-tight mb-6">
              Already know Alexander IP from Fiverr?
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-4">
              Many clients find Alexander IP through Fiverr first. For future
              work, you&apos;re welcome to reach out directly &mdash; same
              service, same quality, with lower costs and more flexibility.
            </p>
            <p className="text-slate-500 mb-8">
              Your existing Fiverr reviews and relationship carry over. This is
              the same practice, the same person &mdash; just a direct
              connection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/contact" size="lg">
                Get in Touch Directly
              </Button>
              <Button href="/services" variant="outline" size="lg">
                View Services &amp; Pricing
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              Why work directly?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="flex gap-4 bg-slate-50 rounded-xl p-6 border border-slate-200"
              >
                <div className="w-10 h-10 bg-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Fiverr link */}
      <section className="py-12 bg-slate-50">
        <Container size="narrow">
          <div className="text-center">
            <p className="text-slate-600 mb-4">
              Want to check the track record first? Alexander IP has 800+
              five-star reviews on Fiverr.
            </p>
            <a
              href="https://www.fiverr.com/alexander_ip"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-blue font-medium hover:text-blue-dark transition-colors"
            >
              View Fiverr profile
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-navy to-navy-light">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to continue working together?
            </h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              Reach out directly with your next project. Alexander IP will
              respond within 24&ndash;48 hours.
            </p>
            <Button href="/contact" size="lg">
              Start Your Enquiry
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
