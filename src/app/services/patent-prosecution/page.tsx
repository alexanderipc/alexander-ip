import { Metadata } from "next";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import VideoEmbed from "@/components/ui/VideoEmbed";
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
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6">Patent Prosecution</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-tight mb-6">
                {service.title}
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                {service.description}
              </p>
              <Button href="/contact" size="lg">
                Get Help With an Office Action
              </Button>
            </div>
            <VideoEmbed
              title="About Patent Prosecution"
              subtitle="Service overview video coming soon"
            />
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
              Expert analysis and strategic responses to all types of patent
              office rejections and objections.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {service.features.map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-3 bg-slate-50 rounded-lg p-4"
              >
                <CheckCircle2 className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{feature}</span>
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
                <CheckCircle2 className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing: Part A and Part B */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              Two-Part Pricing
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Prosecution is split into two parts so you understand the
              situation and approve the strategy before committing to the
              full formal response.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {service.pricing.map((tier, index) => (
              <Card key={tier.name} padding="lg" className="flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      {index === 0 ? "A" : "B"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-navy">
                      {tier.name}
                    </h3>
                    <p className="text-sm text-slate-500">{tier.description}</p>
                  </div>
                </div>

                <div className="text-3xl font-bold text-navy mb-6">
                  {tier.price}
                </div>

                <div className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {index === 0 && (
                  <div className="flex items-center gap-2 text-sm text-slate-400 pt-4 border-t border-slate-100">
                    <ArrowRight className="w-4 h-4" />
                    <span>
                      After review, you decide whether to proceed to Part B
                    </span>
                  </div>
                )}
                {index === 1 && (
                  <div className="flex items-center gap-2 text-sm text-slate-400 pt-4 border-t border-slate-100">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Response document ready for filing with the patent office
                    </span>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Combined pricing note */}
          <div className="mt-8 max-w-4xl mx-auto">
            <Card padding="md" className="bg-teal/5 border-teal/20">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="flex-1">
                  <p className="font-semibold text-navy">
                    Combined Total: $1,250 &ndash; $1,700
                  </p>
                  <p className="text-sm text-slate-600">
                    Part A + Part B together, depending on complexity.
                    Delivery: {service.delivery} per part.
                  </p>
                </div>
                <Button href="/contact" size="sm">
                  Get Started
                </Button>
              </div>
            </Card>
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
              Received a Patent Office Rejection?
            </h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              Don&apos;t give up on your application. Many patents are granted
              after an initial rejection with the right strategic response.
              Get expert help today.
            </p>
            <Button href="/contact" size="lg">
              Get Help With Your Office Action
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
