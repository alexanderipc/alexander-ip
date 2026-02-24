import { Metadata } from "next";
import { Shield, Link as LinkIcon, Database, CheckCircle2 } from "lucide-react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Patent Portfolio | Alexander IP Consulting",
  description:
    "Blockchain-verified patent portfolio display. Coming soon — a transparent, verifiable record of patents secured.",
};

const features = [
  {
    icon: Shield,
    title: "Blockchain Verified",
    description:
      "Every patent record anchored on-chain for tamper-proof provenance verification.",
  },
  {
    icon: LinkIcon,
    title: "Public Verification Links",
    description:
      "Anyone can independently verify patent grant status through official registries.",
  },
  {
    icon: Database,
    title: "Patent Family Tracking",
    description:
      "Visualise patent families across jurisdictions with status tracking for each member.",
  },
  {
    icon: CheckCircle2,
    title: "Real-Time Status",
    description:
      "Up-to-date information on application status: pending, published, granted, or expired.",
  },
];

export default function PortfolioPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <Container size="narrow">
          <div className="text-center">
            <Badge variant="amber" className="mb-6">
              Coming Soon
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-navy mb-4">
              Verified Patent Portfolio
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
              A blockchain-backed display of patents secured through Alexander
              IP Consulting. Transparent, verifiable, and tamper-proof.
            </p>
          </div>
        </Container>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <Container>
          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-50">
        <Container>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-navy mb-4">
              Want to Be Notified When This Launches?
            </h2>
            <p className="text-slate-600 mb-8">
              Get in touch and I&apos;ll let you know when the verified portfolio
              is live.
            </p>
            <Button href="/contact">Contact Me</Button>
          </div>
        </Container>
      </section>
    </>
  );
}
