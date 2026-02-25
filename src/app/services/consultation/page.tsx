import { Metadata } from "next";
import { CheckCircle2, ShieldCheck, Calendar, RefreshCw } from "lucide-react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import VideoEmbed from "@/components/ui/VideoEmbed";
import Accordion from "@/components/ui/Accordion";
import { getServiceBySlug } from "@/data/services";

const service = getServiceBySlug("consultation")!;

export const metadata: Metadata = {
  title: `${service.title} | Alexander IP Consulting`,
  description: service.description,
};

export default function ConsultationPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6">Consultation</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-tight mb-6">
                {service.title}
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                {service.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button href="/contact" size="lg">
                  Book a Consultation &mdash; {service.startingPrice}
                </Button>
              </div>
            </div>
            <VideoEmbed
              title="About Consultations"
              subtitle="Service overview video coming soon"
            />
          </div>
        </Container>
      </section>

      {/* Refund Guarantee Banner */}
      <section className="bg-blue/5 border-y border-blue/20">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-6 text-center sm:text-left">
            <div className="w-12 h-12 bg-blue/10 rounded-full flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-blue" />
            </div>
            <div>
              <p className="font-semibold text-navy text-lg">
                Full Refund Guarantee
              </p>
              <p className="text-slate-600 text-sm">
                If I&apos;m unable to provide value during the consultation,
                you&apos;ll receive a complete refund. No questions asked.
              </p>
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
              A focused session covering everything you need to make an
              informed decision about your IP strategy.
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

      {/* How It Works */}
      <section className="py-20 bg-slate-50">
        <Container size="narrow">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              How It Works
            </h2>
          </div>
          <div className="space-y-6">
            {[
              {
                icon: Calendar,
                step: "1",
                title: "Book Your Consultation",
                description:
                  "Get in touch via the contact form with a brief description of your invention. I'll confirm availability and schedule a time.",
              },
              {
                icon: RefreshCw,
                step: "2",
                title: "Live Video Session",
                description:
                  "We'll discuss your invention in detail. I'll assess patentability, recommend filing strategy, and answer all your questions.",
              },
              {
                icon: CheckCircle2,
                step: "3",
                title: "Written Summary",
                description:
                  "You'll receive a written summary of the key points discussed, including strategic recommendations and next steps.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-4 bg-white rounded-xl p-6 border border-slate-200"
              >
                <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-navy mb-1">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
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
                className="flex items-start gap-3 bg-slate-50 rounded-lg p-4"
              >
                <CheckCircle2 className="w-5 h-5 text-blue flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-slate-50">
        <Container size="narrow">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">Pricing</h2>
          </div>
          {service.pricing.map((tier) => (
            <Card key={tier.name} padding="lg" className="max-w-lg mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-navy mb-2">
                  {tier.name}
                </h3>
                <p className="text-slate-500 text-sm mb-4">
                  {tier.description}
                </p>
                <div className="text-4xl font-bold text-navy">
                  {tier.price}
                </div>
              </div>
              <div className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              <Button href="/contact" size="lg" className="w-full">
                Book a Consultation
              </Button>
            </Card>
          ))}
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
              Ready to Discuss Your Invention?
            </h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              Book a consultation and get expert advice tailored to your
              specific situation. Full refund if I can&apos;t provide value.
            </p>
            <Button href="/contact" size="lg">
              Book a Consultation &mdash; {service.startingPrice}
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
