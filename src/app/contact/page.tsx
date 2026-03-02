import { Metadata } from "next";
import { Mail, MapPin, Shield, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import IntakeForm from "@/components/forms/IntakeForm";
import LocalizedPrice from "@/components/ui/LocalizedPrice";

export const metadata: Metadata = {
  title: "Contact | Alexander IP",
  description:
    "Tell Alexander IP about your invention. Every enquiry is personally reviewed with a response within 24-48 hours, including honest advice on whether patent protection makes sense.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;

  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-20 bg-gradient-to-b from-slate-50 to-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left: Form */}
            <div>
              <Badge className="mb-6">Get In Touch</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-navy mb-4">
                Tell me about your invention.
              </h1>
              <p className="text-lg text-slate-600 mb-8">
                Alexander IP personally reviews every enquiry and responds
                within 24&ndash;48 hours during business days. If your invention
                isn&apos;t something Alexander IP can help with, you&apos;ll be
                told honestly &mdash; and pointed in the right direction.
              </p>
              <IntakeForm defaultService={service} />
            </div>

            {/* Right: Info */}
            <div className="space-y-8 lg:pl-8">
              {/* Book a Consultation card */}
              <Link href="/services/consultation" className="group block">
                <Card hover padding="lg" className="border-blue/20 bg-blue/5">
                  <div className="flex gap-4">
                    <div className="w-11 h-11 bg-blue rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-navy mb-1">
                        Book a Consultation
                      </h3>
                      <p className="text-sm text-slate-600 mb-2">
                        Not sure where to start? A 30-minute consultation
                        covers whether your idea is patentable, what
                        protection would involve, and the best path forward.
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-blue font-bold">
                          <LocalizedPrice
                            amount={125}
                            prefix="From"
                            fallback="From $125"
                          />
                        </span>
                        <span className="text-sm text-blue font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                          View details
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy">Email</h3>
                    <a
                      href="mailto:alexanderip.contact@gmail.com"
                      className="text-sm text-blue hover:text-blue-dark"
                    >
                      alexanderip.contact@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy">Location</h3>
                    <p className="text-sm text-slate-600">
                      Kington, United Kingdom (work with clients worldwide)
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy">
                      Confidentiality
                    </h3>
                    <p className="text-sm text-slate-600">
                      NDAs are provided after engagement begins, before you
                      submit confidential invention details.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
