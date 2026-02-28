import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Accordion from "@/components/ui/Accordion";
import CustomProjectForm from "@/components/ui/CustomProjectForm";
import { FileText, Shield, Clock, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Custom Project | Alexander IP",
  description:
    "Pay for a custom IP project at a pre-agreed price. Set your amount, describe your project, and get started instantly.",
};

const faqItems = [
  {
    question: "What is a custom project?",
    answer:
      "Custom projects cover any IP work that doesn\u2019t fit the standard service tiers \u2014 for example, a specific combination of services, unusual scope, or a continuation of previous work at an agreed rate.",
  },
  {
    question: "How do I know what amount to enter?",
    answer:
      "Enter the exact amount you were quoted by Alexander IP. If you haven\u2019t received a quote yet, please book a consultation first so we can discuss your needs.",
  },
  {
    question: "What happens after I pay?",
    answer:
      "Your project is created automatically in your client portal. You\u2019ll receive a confirmation email with a link to track progress. Work begins within 1\u20132 business days.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "If work hasn\u2019t started, you\u2019re eligible for a full refund. Once work has begun, partial refunds are assessed on a case-by-case basis. Contact us to discuss.",
  },
];

export default function CustomProjectPage() {
  return (
    <main>
      {/* Hero */}
      <section className="py-16 lg:py-20 bg-gradient-to-b from-slate-50 to-white">
        <Container size="narrow">
          <div className="text-center">
            <Badge className="mb-6">Custom Work</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-navy tracking-tight mb-6">
              Custom Project
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Been quoted a custom price? Enter the agreed amount, describe your
              project, and pay securely. Your project will be set up
              automatically in your client portal.
            </p>
          </div>
        </Container>
      </section>

      {/* Form */}
      <section className="py-16 md:py-20 bg-slate-50">
        <Container size="narrow">
          <CustomProjectForm />
        </Container>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20">
        <Container size="narrow">
          <h2 className="text-2xl md:text-3xl font-bold text-navy text-center mb-12">
            How it works
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: FileText,
                title: "Enter your details",
                desc: "Set the amount you were quoted and describe the work you need.",
              },
              {
                icon: Shield,
                title: "Pay securely",
                desc: "Complete payment via Stripe. Your card details are never shared with us.",
              },
              {
                icon: Clock,
                title: "Project created instantly",
                desc: "Your project appears in your client portal within seconds of payment.",
              },
              {
                icon: MessageSquare,
                title: "Track progress",
                desc: "Follow your project through every stage with real-time status updates.",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="flex gap-4 p-6 bg-white rounded-xl border border-slate-200"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-slate-50">
        <Container size="narrow">
          <h2 className="text-2xl md:text-3xl font-bold text-navy text-center mb-10">
            Questions
          </h2>
          <Accordion items={faqItems} className="max-w-2xl mx-auto" />
        </Container>
      </section>
    </main>
  );
}
