import { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Accordion from "@/components/ui/Accordion";
import { getServiceBySlug } from "@/data/services";

const service = getServiceBySlug("patent-prosecution")!;

export const metadata: Metadata = {
  title: `${service.title} | Alexander IP Consulting`,
  description: service.description,
};

export default function PatentProsecutionPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <Container>
          <div className="max-w-3xl">
            <Badge className="mb-6">Office Correspondence</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-tight mb-6">
              {service.title}
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              {service.longDescription}
            </p>
            <Button href="/contact?service=patent-prosecution" size="lg">
              Get a Quote
            </Button>
          </div>
        </Container>
      </section>

      {/* What's Included */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              What We Handle
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Every case is different. Here&apos;s the range of
              issues we routinely deal with.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {service.features.map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-3 bg-slate-50 rounded-lg p-4"
              >
                <CheckCircle2 className="w-5 h-5 text-blue flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-slate-50">
        <Container size="narrow">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              Quote-Based Pricing
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Office correspondence work varies enormously — a simple formality response is
              very different from a complex obviousness argument with multiple
              prior art references. Rather than a one-size-fits-all price,
              we quote each case individually so you only pay for what your
              situation requires.
            </p>
          </div>

          <Card padding="lg" className="text-center">
            <h3 className="text-xl font-semibold text-navy mb-3">
              How It Works
            </h3>
            <div className="space-y-4 text-left max-w-lg mx-auto">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-navy rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <p className="text-slate-600">
                  Send us your office action or application details via the
                  enquiry form.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-navy rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <p className="text-slate-600">
                  We review the situation and provide a tailored quote within
                  48 hours.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-navy rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <p className="text-slate-600">
                  If you proceed, we develop a strategy, draft the response,
                  and deliver it ready for filing.
                </p>
              </div>
            </div>
            <div className="mt-8">
              <Button href="/contact?service=patent-prosecution">
                Request a Quote
              </Button>
            </div>
          </Card>
        </Container>
      </section>

      {/* Who Is This For? */}
      <section className="py-20 bg-white">
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
                className="flex items-start gap-3 bg-slate-50 rounded-lg p-4 border border-slate-200"
              >
                <CheckCircle2 className="w-5 h-5 text-blue flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50">
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
              Need Help With a Patent Office Response?
            </h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              Whether it&apos;s an office action, a restriction requirement, or
              any other examiner correspondence — send it over and
              we&apos;ll provide a tailored quote.
            </p>
            <Button href="/contact?service=patent-prosecution" size="lg">
              Get a Quote
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
