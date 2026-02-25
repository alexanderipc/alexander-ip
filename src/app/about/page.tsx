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
                Why This
                <br />
                Practice Exists
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-4">
                The patent industry has a problem: it doesn&apos;t serve smaller
                innovators well. If you&apos;re an independent inventor or an
                early-stage startup, getting a patent drafted typically means
                paying $8,000&ndash;$15,000 in attorney fees alone &mdash; or
                trying to navigate a complex legal system without guidance.
              </p>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                I started this practice to change that. You get the same depth
                of training, the same rigorous work, and the same results as a
                top-tier firm &mdash; without the overheads that make their
                pricing inaccessible.
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
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue/10 rounded-full blur-2xl" />
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
                <stat.icon className="w-5 h-5 text-blue mx-auto mb-1.5" />
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
              specialised in practical laboratory physics. After graduating in
              2016, I went straight into training as a patent attorney at
              Kilburn &amp; Strode LLP &mdash; one of the UK&apos;s leading
              intellectual property firms and a long-standing Legal 500 name.
            </p>
            <p>
              At Kilburn &amp; Strode, I earned a Certificate in Intellectual
              Property from Queen Mary University of London. I focused on
              software and telecommunications patents, handling European patent
              prosecution for clients including Research in Motion (BlackBerry)
              and Cisco. After more than two years there, I moved between firms
              to deepen my experience in patent drafting, filing strategies, and
              portfolio management.
            </p>
            <p>
              By 2020, I had passed the pre-EQE and was on track to sit the
              European Patent Attorney qualifying exams. Then COVID-19 cancelled
              all exam sittings. During the disruption, I began freelancing
              &mdash; and what I found surprised me. There was enormous unmet
              demand for high-quality patent services from smaller innovators who
              couldn&apos;t afford traditional firm fees but still needed
              rigorous, professional work.
            </p>
            <p>
              Going independent wasn&apos;t a fallback. It was a deliberate
              choice. Without big-firm overheads &mdash; the central London
              offices, the partner profit margins, the layers of administration
              &mdash; I could offer the same calibre of work at a fraction of
              the price. At a traditional patent firm, a single US utility
              patent application typically costs $8,000&ndash;$15,000 in
              attorney fees alone. My clients get the same depth of analysis and
              quality of drafting, starting from $995.
            </p>
            <p>
              Five years later, the practice has served hundreds of clients
              across all major international jurisdictions, with demand
              consistently growing. In 2024, I incorporated as{" "}
              <strong>Alexander IPC Ltd</strong>, formalising what had already
              become a trusted name in accessible patent services. I&apos;m based
              in Bristol, UK, and work with inventors and startups worldwide.
            </p>
          </div>
        </Container>
      </section>

      {/* The Qualification Question */}
      <section className="py-20 bg-slate-50">
        <Container size="narrow">
          <h2 className="text-3xl font-bold text-navy mb-8">
            The Qualification Question
          </h2>
          <div className="prose prose-lg prose-slate max-w-none space-y-6 text-slate-600 leading-relaxed">
            <p>
              You might be wondering: is he a qualified patent attorney? Here&apos;s
              the straightforward answer.
            </p>
            <p>
              I have the full training and track record of a qualified patent
              attorney. I completed a multi-year training programme at one of the
              UK&apos;s top Legal 500 IP firms, passed the pre-EQE, and was on
              track to sit the final qualifying exams when they were cancelled
              due to COVID-19. The formal title hasn&apos;t followed &mdash; but
              the substance has.
            </p>
            <p>
              Since then, I&apos;ve drafted and prosecuted hundreds of patent
              applications across the US, UK, Europe, and other major
              jurisdictions. I&apos;ve worked with individual inventors,
              startups, and established businesses. Over five years of
              independent practice, I&apos;ve accumulated more than 800
              five-star reviews from clients who chose to come back, and to
              refer others.
            </p>
            <p>
              If you&apos;re evaluating whether to work with me, the question
              isn&apos;t whether I hold a specific title. It&apos;s whether the
              work is good, whether the results speak for themselves, and
              whether you&apos;re getting genuine expertise at a fair price.
              The track record answers all three.
            </p>
          </div>
        </Container>
      </section>

      {/* Credentials */}
      <section className="py-20 bg-white">
        <Container>
          <h2 className="text-3xl font-bold text-navy mb-10 text-center">
            Credentials &amp; Training
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {credentials.map((cred) => (
              <div
                key={cred.title}
                className="flex gap-4 bg-slate-50 rounded-xl p-6 border border-slate-200"
              >
                <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center flex-shrink-0">
                  <cred.icon className="w-5 h-5 text-blue" />
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
      <section className="py-20 bg-slate-50">
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
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2"
              >
                <CheckCircle2 className="w-4 h-4 text-blue flex-shrink-0" />
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
