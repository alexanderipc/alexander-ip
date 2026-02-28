import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import CustomProjectForm from "@/components/ui/CustomProjectForm";
import { FileText, Shield, Clock, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Custom Project | Alexander IP",
  description:
    "Pay for a custom IP project at a pre-agreed price. Set your amount, describe your project, and get started instantly.",
};

export default function CustomProjectPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent" />
        <Container>
          <div className="relative py-20 md:py-28 text-center max-w-3xl mx-auto">
            <span className="inline-block px-3 py-1 mb-6 text-xs font-semibold tracking-wider uppercase rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Custom Work
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Custom Project
            </h1>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed">
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
          <div className="space-y-4 max-w-2xl mx-auto">
            {[
              {
                q: "What is a custom project?",
                a: "Custom projects cover any IP work that doesn't fit the standard service tiers — for example, a specific combination of services, unusual scope, or a continuation of previous work at an agreed rate.",
              },
              {
                q: "How do I know what amount to enter?",
                a: "Enter the exact amount you were quoted by Alexander IP. If you haven't received a quote yet, please book a consultation first so we can discuss your needs.",
              },
              {
                q: "What happens after I pay?",
                a: "Your project is created automatically in your client portal. You'll receive a confirmation email with a link to track progress. Work begins within 1-2 business days.",
              },
              {
                q: "Can I get a refund?",
                a: "If work hasn't started, you're eligible for a full refund. Once work has begun, partial refunds are assessed on a case-by-case basis. Contact us to discuss.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-navy hover:bg-slate-50 transition-colors">
                  {faq.q}
                  <span className="ml-4 text-slate-400 group-open:rotate-45 transition-transform text-xl leading-none">
                    +
                  </span>
                </summary>
                <p className="px-5 pb-5 text-slate-600 text-sm leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
