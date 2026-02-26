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
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About Alexander Rowley | Alexander IP",
  description:
    "MSc Physics from the University of Bristol, trained at Kilburn & Strode LLP (Legal 500). 10 years in the patent industry, 50+ patents granted across US, UK, and Europe. The specialist behind Alexander IP.",
};

const credentials = [
  {
    icon: GraduationCap,
    title: "MSc Physics",
    subtitle: "University of Bristol (2012\u20132016)",
    highlight: true,
  },
  {
    icon: GraduationCap,
    title: "Certificate in Intellectual Property",
    subtitle: "Queen Mary University of London",
    highlight: false,
  },
  {
    icon: Building2,
    title: "Trained at Kilburn & Strode LLP",
    subtitle: "Top-tier Legal 500 IP firm, London",
    highlight: false,
  },
  {
    icon: Award,
    title: "Pre-EQE Passed",
    subtitle: "European Patent Attorney qualifying exams",
    highlight: false,
  },
];

const stats = [
  { icon: Star, value: "800+", label: "Five-Star Reviews" },
  { icon: Award, value: "50+", label: "Patents Granted" },
  { icon: Globe, value: "155+", label: "PCT Contracting States" },
  { icon: Clock, value: "10", label: "Years in the Industry" },
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
                The person behind
                <br />
                the practice
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-4">
                Alexander IP exists because the patent system doesn&apos;t serve
                the people it should. Patent attorney firms are structured around
                large corporate portfolios. Individual inventors and early-stage
                companies get junior associates, impersonal service, and invoices
                that assume a corporate legal budget.
              </p>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                This practice was founded to change that &mdash; same calibre of
                work, different model, different clients.
              </p>
              <Button href="/contact">Get in Touch</Button>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/alexander-headshot.png"
                  alt="Alexander Rowley &mdash; Patent Consultant"
                  width={600}
                  height={600}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-navy/5 rounded-full blur-2xl" />
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
                <span className="text-sm text-slate-200">{stat.label}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Story — 8-beat narrative */}
      <section className="py-20 bg-white">
        <Container size="narrow">
          <h2 className="text-3xl font-bold text-navy mb-8">My Story</h2>
          <div className="prose prose-lg prose-slate max-w-none space-y-6 text-slate-600 leading-relaxed">
            {/* 1. The origin — brief */}
            <p>
              I grew up around an inventor. My stepfather spent decades building
              things &mdash; machines, mechanisms, ideas that kept him up at
              night. That&apos;s what first made the patent system interesting to
              me: the idea that someone could protect what they&apos;d built.
            </p>

            {/* 2. The credential paragraph — Physics first */}
            <p>
              I hold an MSc in Physics from the University of Bristol, where I
              specialised in practical laboratory physics. That technical
              foundation is what makes everything else work &mdash; it means I
              can genuinely understand inventions across mechanical, electrical,
              software, and scientific domains. I&apos;m not a lawyer learning
              your technology on the fly; I come from the same technical world as
              my clients.
            </p>
            <p>
              After graduating in 2016, I went straight into training at
              Kilburn &amp; Strode LLP &mdash; one of the UK&apos;s leading
              intellectual property firms and a long-standing Legal 500 name.
              There I earned a Certificate in Intellectual Property from Queen
              Mary University of London and focused on software and
              telecommunications patents, handling European patent prosecution
              for clients including Research in Motion (BlackBerry) and Cisco.
            </p>

            {/* 3. The real pivot */}
            <p>
              Working at top firms, I spent years doing high-quality patent work
              for major corporations &mdash; and never met a single inventor.
              The clients were legal departments, not the people who&apos;d
              actually built something. The work was technically excellent but
              impersonal. Going independent wasn&apos;t just about pricing or
              flexibility &mdash; it was about doing the same calibre of work
              for the people who actually care whether their patent gets granted.
              Individual inventors, small teams, founders protecting their first
              product. The people the patent system was theoretically designed
              for but practically ignores.
            </p>

            {/* 4. The career path */}
            <p>
              After Kilburn &amp; Strode, I moved between firms to broaden my
              experience across drafting, prosecution, filing strategy, and
              portfolio management. By 2020, I had passed the pre-EQE and was
              on track to sit the European Patent Attorney qualifying exams.
              Then COVID-19 cancelled all exam sittings.
            </p>

            {/* 5. The discovery */}
            <p>
              During the disruption, I began freelancing &mdash; and what I
              found surprised me. There was enormous unmet demand for
              high-quality patent services from smaller innovators who
              couldn&apos;t afford traditional firm fees but still needed
              rigorous, professional work. Five years and 800+ five-star reviews
              later, that stopgap became Alexander IP.
            </p>

            {/* 6. The philosophy */}
            <p>
              The patent industry &mdash; and especially patent attorney firms
              &mdash; is structurally built for applicants with large portfolios.
              Alexander IP is trying to do the opposite: turn the odds in the
              inventor&apos;s favour a bit. Same quality of work, transparent
              pricing, and communication that doesn&apos;t require a law degree
              to decode.
            </p>

            {/* 7. The honest bit about qualification */}
            <h3 className="text-xl font-semibold text-navy mt-8 mb-3">
              The qualification question
            </h3>
            <p>
              I&apos;m not a registered patent attorney. I have the full
              training &mdash; multi-year programme at a top Legal 500 firm,
              pre-EQE passed &mdash; but chose independent practice over the
              qualification bureaucracy. I file applications under clients&apos;
              names (as pro se for US applications, or through registered agents
              where required). My track record of 50+ grants across multiple
              jurisdictions speaks for itself, but I&apos;m always transparent
              about this distinction.
            </p>

            {/* 8. What clients actually get */}
            <h3 className="text-xl font-semibold text-navy mt-8 mb-3">
              What you get
            </h3>
            <p>
              When you work with Alexander IP, you get one person who
              understands your invention deeply, handles every stage personally,
              and is genuinely invested in getting your patent granted. No
              handoffs, no juniors, no account managers. Many clients come back
              with their second, third, or sixth invention &mdash; because the
              relationship is built on trust, not transactions.
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
                className={`flex gap-4 rounded-xl p-6 border ${
                  cred.highlight
                    ? "bg-blue/5 border-blue/20"
                    : "bg-white border-slate-200"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    cred.highlight ? "bg-blue" : "bg-navy"
                  }`}
                >
                  <cred.icon className={`w-5 h-5 ${cred.highlight ? "text-white" : "text-blue"}`} />
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
              Alexander IP covers virtually any technical subject matter. The
              only area generally excluded is in-depth biological or biotech
              applications.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {techAreas.map((area) => (
              <div
                key={area}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2"
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
              Describe your invention briefly and Alexander IP will come back
              with honest, tailored advice on the best path forward.
            </p>
            <Button href="/contact" size="lg">
              Get in Touch
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
