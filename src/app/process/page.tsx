import { Metadata } from "next";
import {
  MessageSquare,
  Search,
  FileText,
  Send,
  Scale,
  Award,
  Globe,
  Clock,
  DollarSign,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LocalizedPrice from "@/components/ui/LocalizedPrice";

export const metadata: Metadata = {
  title: "How It Works | Alexander IP Consulting",
  description:
    "From initial idea to granted patent. A clear, structured process with expert guidance at every step. See the typical client journey and timeline.",
};

const journey1Steps = [
  {
    icon: MessageSquare,
    title: "Enquiry",
    description:
      "You reach out with a brief description of your invention. We respond within 24\u201348 hours with initial thoughts and recommended next steps.",
    timeline: "Day 1",
    cost: "Free",
  },
  {
    icon: Search,
    title: "Patent Search (Optional but Recommended)",
    description:
      "Before investing in a full application, a novelty search helps you understand what's already out there. It's optional — you can go straight to drafting — but it's strongly recommended. It often shapes the direction of the claims and can save significant time and money down the line.",
    timeline: "21 days",
    costUsd: 335,
  },
  {
    icon: FileText,
    title: "Patent Drafting",
    description:
      "We prepare the full patent application — background, summary, detailed description, claims, abstract, and drawings — and file it with the patent office on your behalf.",
    timeline: "45 days",
    costUsd: 995,
  },
  {
    icon: Send,
    title: "Filing",
    description:
      "Your application is filed with the patent office (USPTO, UKIPO, EPO, or other). You receive a filing receipt and your 'patent pending' status begins.",
    timeline: "1\u20132 days after approval",
    costUsd: 250, costSuffix: "+ govt fees",
  },
  {
    icon: Scale,
    title: "Correspondence",
    description:
      "After filing, the patent office will examine your application and may raise objections, request amendments, or issue other correspondence. We handle all of this — developing a strategy and drafting formal responses to get your patent granted.",
    timeline: "12\u201324 months after filing",
    cost: "Quoted per case",
  },
  {
    icon: Award,
    title: "Grant",
    description:
      "Your patent is granted, giving you legal protection for your invention. This typically takes 2\u20134 years from the original filing date.",
    timeline: "2\u20134 years total",
    cost: "Grant fees apply",
  },
];

const journey2Steps = [
  {
    icon: MessageSquare,
    title: "Enquiry",
    description:
      "Share your office action or existing application details. We'll review and advise on the best approach.",
    timeline: "Day 1",
  },
  {
    icon: Search,
    title: "Review & Strategy (Part A)",
    description:
      "Detailed analysis of all examiner objections, prior art review, and a proposed response strategy for your approval.",
    timeline: "7\u201314 days",
  },
  {
    icon: FileText,
    title: "Formal Response (Part B)",
    description:
      "Drafting of the official response document with legal arguments, claim amendments, and supporting evidence.",
    timeline: "7\u201314 days",
  },
  {
    icon: Award,
    title: "Grant",
    description:
      "With the right response strategy, many patents that receive initial rejections go on to be granted.",
    timeline: "3\u201312 months",
  },
];

const journey3Steps = [
  {
    icon: Send,
    title: "US Priority Filing",
    description: "File first in the US to establish your priority date.",
    timeline: "Month 0",
  },
  {
    icon: Globe,
    title: "PCT Application",
    description:
      "Within 12 months, file a PCT international application. Think of it as holding your place in line internationally — you get global 'patent pending' status without committing to specific countries yet.",
    timeline: "Month 12",
  },
  {
    icon: FileText,
    title: "National Phase Entry",
    description:
      "At 30 months, you decide which countries to actually file in. The PCT buys you time to test the market, raise funding, or figure out where the product is actually selling.",
    timeline: "Month 30",
  },
  {
    icon: Award,
    title: "Multiple Grants",
    description:
      "Prosecute to grant in each country, building worldwide patent protection.",
    timeline: "Years 2\u20135",
  },
];

interface TimelineProps {
  steps: {
    icon: React.ElementType;
    title: string;
    description: string;
    timeline: string;
    cost?: string;
    costUsd?: number;
    costSuffix?: string;
  }[];
}

function Timeline({ steps }: TimelineProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.title} className="relative flex gap-6">
          {/* Line */}
          <div className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 z-10 shadow-md ${
                i === steps.length - 1
                  ? "bg-blue text-white"
                  : "bg-navy text-blue"
              }`}
            >
              <step.icon className="w-5 h-5" />
            </div>
            {i < steps.length - 1 && (
              <div className="w-px h-full bg-slate-200 min-h-[2rem]" />
            )}
          </div>

          {/* Content */}
          <div className="pb-10">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-navy text-lg">{step.title}</h3>
              <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 rounded-full px-2.5 py-0.5">
                <Clock className="w-3 h-3" />
                {step.timeline}
              </div>
              {(step.cost || step.costUsd) && (
                <div className="flex items-center gap-1 text-xs text-blue-dark bg-blue/10 rounded-full px-2.5 py-0.5">
                  <DollarSign className="w-3 h-3" />
                  {step.costUsd ? (
                    <>From <LocalizedPrice amount={step.costUsd} fallback={`$${step.costUsd}`} />{step.costSuffix ? ` ${step.costSuffix}` : ""}</>
                  ) : (
                    step.cost
                  )}
                </div>
              )}
            </div>
            <p className="text-slate-600 leading-relaxed">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProcessPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-20 bg-gradient-to-b from-slate-50 to-white">
        <Container size="narrow">
          <div className="text-center">
            <Badge className="mb-6">How It Works</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-navy mb-4">
              Your Patent Journey
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A clear, structured process with expert guidance at every step.
              Here&apos;s what a typical engagement looks like, from initial
              enquiry to granted patent.
            </p>
          </div>
        </Container>
      </section>

      {/* Journey 1: New Invention */}
      <section className="py-16 bg-white">
        <Container size="narrow">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-navy mb-2">
              Journey 1: New Invention
            </h2>
            <p className="text-slate-600">
              The most common path — you have a new invention and want to
              protect it. Here&apos;s what the process looks like, step by step.
            </p>
          </div>
          <Timeline steps={journey1Steps} />
        </Container>
      </section>

      {/* Journey 2: Existing Application */}
      <section className="py-16 bg-slate-50">
        <Container size="narrow">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-navy mb-2">
              Journey 2: Existing Application
            </h2>
            <p className="text-slate-600">
              Already have a pending application with an office action? We can
              help get it to grant.
            </p>
          </div>
          <Timeline steps={journey2Steps} />
        </Container>
      </section>

      {/* Journey 3: International */}
      <section className="py-16 bg-white">
        <Container size="narrow">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-navy mb-2">
              Journey 3: International Protection
            </h2>
            <p className="text-slate-600">
              The PCT route is like holding your place in line internationally.
              You don&apos;t have to file in every country immediately — the PCT
              buys you time to test the market, raise funding, or figure out
              where the product is actually selling.
            </p>
          </div>
          <Timeline steps={journey3Steps} />
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-navy to-navy-light">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Which Journey Are You On?
            </h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              Whether you&apos;re starting from scratch or need help with an
              existing application, get in touch and we&apos;ll advise on the
              best path forward.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button href="/contact" size="lg">
                Start Your Enquiry
              </Button>
              <Button
                href="/services/consultation"
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                Book a Consultation
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
