import { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Accordion from "@/components/ui/Accordion";
import PackageBuilder from "@/components/services/PackageBuilder";
import { getServiceBySlug } from "@/data/services";

const service = getServiceBySlug("patent-drafting")!;

export const metadata: Metadata = {
  title: `${service.title} | Alexander IP`,
  description: service.description,
};

export default function PatentDraftingPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <Container>
          <div className="max-w-3xl">
            <Badge className="mb-6">Patent Drafting</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-tight mb-6">
              {service.title}
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              {service.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button href="#build-package" size="lg">
                Build Your Package
              </Button>
              <Button href="/services/consultation" variant="outline" size="lg">
                Not Sure? Book a Consultation
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* What's Included */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              What&apos;s Included
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need for a complete, professionally drafted patent
              application ready for filing.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {service.features.map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-3 bg-slate-50 rounded-lg p-4"
              >
                <CheckCircle2 className="w-5 h-5 text-blue flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Who Is This For? */}
      <section className="py-20 bg-slate-50">
        <Container size="narrow">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              Who Is This For?
            </h2>
          </div>
          <div className="space-y-4">
            {service.whoIsItFor.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 bg-white rounded-lg p-4 border border-slate-200"
              >
                <CheckCircle2 className="w-5 h-5 text-blue flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Build Your Drafting Package */}
      <section id="build-package" className="py-20 bg-white scroll-mt-8">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              Build Your Drafting Package
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Select the complexity of your invention, choose any optional
              extras, and pick a delivery timeline. Your total updates live as
              you build your package.
            </p>
          </div>
          <PackageBuilder />
        </Container>
      </section>

      {/* Why does this cost so much less? */}
      <section className="py-12 bg-slate-50">
        <Container size="narrow">
          <Accordion
            items={[
              {
                question:
                  "Why does this cost so much less than a traditional patent firm?",
                answer:
                  "A typical patent attorney firm charges $8,000\u2013$15,000 for a single utility patent application. That price reflects central city offices, partner profit margins, layers of administration, and the overhead of running a large organisation. The work often passes through multiple hands \u2014 a junior associate drafts, a senior associate reviews, a partner signs off. You\u2019re paying for the hierarchy, the building, and the brand name. At Alexander IP, the specialist who understands your invention is the same person who drafts your claims, responds to office actions, and advises on strategy. There are no handoffs, no juniors, no middlemen. The quality comes from rigorous Legal 500 training and 10 years of high-volume practice. The lower pricing comes from a business model with virtually zero overhead \u2014 not from cutting corners on the work itself.",
              },
            ]}
          />
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <Container size="narrow">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          <Accordion items={service.faq} />
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-navy to-navy-light">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              A professionally drafted patent application, ready for filing in
              any major jurisdiction. Fixed fee, no surprises.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="#build-package" size="lg">
                Build Your Package
              </Button>
              <Button href="/services/consultation" variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                Not Sure? Book a Consultation
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
