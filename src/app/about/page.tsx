import { Metadata } from "next";
import Image from "next/image";
import {
  GraduationCap,
  Building2,
  Award,
  Globe,
  Star,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Container from "@/components/ui/Container";
import VideoEmbed from "@/components/ui/VideoEmbed";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About Alexander Rowley | Alexander IP Consulting",
  description:
    "MSc Physics, trained at Kilburn & Strode LLP (Legal 500). 5+ years independent practice, hundreds of patents granted. Learn about the expert behind Alexander IP.",
};

const credentials = [
  {
    icon: GraduationCap,
    title: "MSc Physics",
    subtitle: "University of Bristol (2012\u20132016)",
  },
  {
    icon: GraduationCap,
    title: "Certificate in Intellectual Property",
    subtitle: "Queen Mary University of London",
  },
  {
    icon: Building2,
    title: "Trained at Kilburn & Strode LLP",
    subtitle: "Top-tier Legal 500 IP firm, London",
  },
  {
    icon: Award,
    title: "Pre-EQE Passed",
    subtitle: "European Patent Attorney qualifying exams",
  },
];

const stats = [
  { icon: Star, value: "800+", label: "Five-Star Reviews" },
  { icon: Award, value: "Hundreds", label: "Patents Granted" },
  { icon: Globe, value: "6+", label: "Jurisdictions" },
  { icon: Clock, value: "5+", label: "Years Practice" },
];

const techAreas = [
  "Software & AI",
  "VR/AR Technology",
  "Medical Devices",
  "Consumer Products",
  "Mechanical Inventions",
  "E-Commerce & Logistics",
  "Automotive & Transport",
  "Energy & Infrastructure",
  "IoT & Wearables",
  "Security & Compliance",
  "Communications",
  "And much more",
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6">About Alexander</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-tight mb-6">
                Democratising
                <br />
                Patent Protection
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                I founded Alexander IPC on a simple observation: the patent
                legal industry doesn&apos;t cater well to startups and individual
                inventors — the very source of much genuine innovation.
                Traditional patent firms charge $10,000+ for basic services. I
                deliver the same calibre of work at a fraction of the cost.
              </p>
              <Button href="/contact">Work With Me</Button>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/alexander-headshot.png"
                  alt="Alexander Rowley — Patent Specialist"
                  width={600}
                  height={600}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-teal/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-navy/5 rounded-full blur-2xl" />
              {/* PATENTED stamp watermark */}
              <div className="absolute -bottom-3 -right-3 w-24 h-24 opacity-15">
                <Image
                  src="/images/patented-stamp.svg"
                  alt=""
                  width={96}
                  height={96}
                  className="w-full h-full"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats */}
      <section className="bg-navy py-8">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-5 h-5 text-teal mx-auto mb-1.5" />
                <span className="text-2xl font-bold text-white block">
                  {stat.value}
                </span>
                <span className="text-sm text-slate-400">{stat.label}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Story */}
      <section className="py-20 bg-white">
        <Container size="narrow">
          <h2 className="text-3xl font-bold text-navy mb-8">My Story</h2>
          <div className="prose prose-lg prose-slate max-w-none space-y-6 text-slate-600 leading-relaxed">
            <p>
              I hold an MSc in Physics from the University of Bristol, where I
              specialised in practical laboratory physics. Immediately after
              graduating in 2016, I began training as a patent attorney at
              Kilburn &amp; Strode LLP — a top-tier Legal 500 intellectual
              property firm in London.
            </p>
            <p>
              During my time at Kilburn &amp; Strode, I earned a Certificate in
              Intellectual Property from Queen Mary University of London and
              focused on software and communications patents, working on
              European patent prosecution for major clients including Research
              in Motion (BlackBerry) and Cisco.
            </p>
            <p>
              After over two years, I moved between firms to gain broader
              experience in patent drafting, filing strategies, and portfolio
              management. I was on track to qualify as a European Patent
              Attorney in 2020, having passed the pre-EQE, when COVID-19
              caused the cancellation of all qualification exams.
            </p>
            <p>
              What started as freelancing during the pandemic quickly revealed
              enormous unmet demand for accessible, high-quality patent
              services from someone with rigorous training who wasn&apos;t tied to
              big-firm overheads. Five years later, the practice has served
              hundreds of clients across all major international jurisdictions,
              and demand remains consistently high.
            </p>
            <p>
              In 2024, I incorporated as{" "}
              <strong>Alexander IPC Ltd</strong>, formalising a practice that
              had already established itself as a trusted name in accessible
              patent services.
            </p>
          </div>
        </Container>
      </section>

      {/* Credentials */}
      <section className="py-20 bg-slate-50">
        <Container>
          <h2 className="text-3xl font-bold text-navy mb-10 text-center">
            Credentials &amp; Training
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {credentials.map((cred) => (
              <div
                key={cred.title}
                className="flex gap-4 bg-white rounded-xl p-6 border border-slate-200"
              >
                <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center flex-shrink-0">
                  <cred.icon className="w-5 h-5 text-teal" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy">{cred.title}</h3>
                  <p className="text-sm text-slate-500">{cred.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Technology Areas */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-navy mb-4">
              Technology Areas
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              I cover virtually any technical subject matter. The only area
              generally excluded is in-depth biological or biotech
              applications.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {techAreas.map((area) => (
              <div
                key={area}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2"
              >
                <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700">
                  {area}
                </span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-navy to-navy-light">
        <Container>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Work Together?
            </h2>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              Get in touch with a brief description of your invention and
              I&apos;ll provide tailored advice on the best path forward.
            </p>
            <Button href="/contact" size="lg">
              Get Started
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
