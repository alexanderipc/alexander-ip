import { Metadata } from "next";
import { Mail, MapPin, Clock, Shield } from "lucide-react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import IntakeForm from "@/components/forms/IntakeForm";

export const metadata: Metadata = {
  title: "Contact | Alexander IP Consulting",
  description:
    "Get in touch about patent services. Tell me about your invention and I'll respond within 24-48 hours with tailored advice.",
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
                Start Your Enquiry
              </h1>
              <p className="text-lg text-slate-600 mb-8">
                Tell me about your invention and what you&apos;re looking for.
                I&apos;ll respond within 24&ndash;48 hours with tailored advice on the
                best path forward.
              </p>
              <IntakeForm defaultService={service} />
            </div>

            {/* Right: Info */}
            <div className="space-y-8 lg:pl-8">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy">
                      Response Time
                    </h3>
                    <p className="text-sm text-slate-600">
                      Typically within 24\u201348 hours
                    </p>
                  </div>
                </div>

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
                      Bristol, United Kingdom (work with clients worldwide)
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
