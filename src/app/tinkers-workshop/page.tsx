import { Metadata } from "next";
import {
  Beaker,
  Box,
  Brain,
  Layers,
  ExternalLink,
  Eye,
  MessageSquare,
  Compass,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import PatentExplorer from "@/components/workshop/PatentExplorer";
import WaitlistForm from "@/components/workshop/WaitlistForm";

export const metadata: Metadata = {
  title: "Portfolio Explorer | Alexander IP",
  description:
    "See your patent portfolio as a 3D landscape and ask an AI analyst grounded in your real filings. Live interactive demo below.",
  openGraph: {
    title: "Portfolio Explorer — Alexander IP",
    description:
      "See your patent portfolio as a 3D landscape and ask an AI analyst grounded in your real filings.",
    type: "website",
  },
};

const valueBullets = [
  {
    icon: Eye,
    title: "See the shape of your protection",
    desc: "Each patent family rendered as an organic 3D form. Where the shape bulges, your coverage is deep; where it&rsquo;s thin, you may have gaps.",
  },
  {
    icon: MessageSquare,
    title: "Ask an AI analyst anything",
    desc: "&ldquo;What does this portfolio cover?&rdquo; &ldquo;Where&rsquo;s the design-around risk?&rdquo; Answers cite specific patent numbers, claim text, and dates — not vibes.",
  },
  {
    icon: Compass,
    title: "Spot geographic & strategic gaps",
    desc: "Continuation strategy, PCT routes, national phase coverage — all visible at a glance across jurisdictions.",
  },
];

const techStack = [
  {
    icon: Box,
    label: "Three.js",
    desc: "3D organic shapes that visualize the scope of each patent family",
  },
  {
    icon: Brain,
    label: "Claude AI",
    desc: "AI patent analyst trained on your filing data — ask anything about your portfolio",
  },
  {
    icon: Layers,
    label: "Portfolio Shape",
    desc: "See how patent families combine to define your total protection coverage",
  },
  {
    icon: Beaker,
    label: "Scope Engine",
    desc: "Multi-axis claim analysis: breadth, flexibility, coverage, specificity, and more",
  },
];

export default function TinkersWorkshop() {
  return (
    <>
      {/* Hero */}
      <section className="py-12 md:py-16 border-b border-slate-100">
        <Container>
          <div className="max-w-3xl">
            <Badge variant="teal">Experimental — Free during beta</Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-navy mt-4 mb-4 tracking-tight">
              Portfolio Explorer
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
              See your patent portfolio as a 3D landscape. Ask an AI analyst
              grounded in your <em>actual</em> filings — not a generic chatbot.
              Built by Alexander IP for inventors who want to understand what
              they own.
            </p>
          </div>

          {/* 3 value bullets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
            {valueBullets.map((v) => (
              <div
                key={v.title}
                className="bg-white border border-slate-100 rounded-xl p-5"
              >
                <v.icon className="w-5 h-5 text-blue-600 mb-3" />
                <h3 className="text-sm font-semibold text-navy mb-1.5">
                  {v.title}
                </h3>
                <p
                  className="text-sm text-slate-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: v.desc }}
                />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Live demo */}
      <section className="py-10 md:py-14">
        <Container size="wide">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-navy">
                  Live demo — Fontaine Farm portfolio
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-slate-500 text-sm max-w-2xl">
                Real portfolio loaded below. Rotate the 3D view, hover the
                patent families, and ask the AI analyst on the right anything
                about the filings.
              </p>
            </div>
            <a
              href="/explorer?q=fontaine+farm"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap transition-colors"
            >
              Open full screen
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Explorer embed — auto-loads Fontaine Farm via ?q= param */}
          <PatentExplorer src="/explorer?q=fontaine+farm" />
        </Container>
      </section>

      {/* Waitlist */}
      <section className="py-12 md:py-16 bg-slate-50 border-y border-slate-100">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3">
              Want your own portfolio loaded in?
            </h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Join the beta waitlist. I&rsquo;ll build the 3D visualization for
              your own filings and email you when it&rsquo;s ready. Free during
              beta — you just need an existing filing (or a patent family
              you&rsquo;d like to explore) to point me at.
            </p>
            <div className="max-w-xl mx-auto">
              <WaitlistForm />
            </div>
          </div>
        </Container>
      </section>

      {/* Tech stack + how it works */}
      <section className="py-10 md:py-14">
        <Container size="wide">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {techStack.map((item) => (
              <div
                key={item.label}
                className="bg-white border border-slate-100 rounded-xl p-5 hover:border-slate-200 hover:shadow-sm transition-all"
              >
                <item.icon className="w-5 h-5 text-teal-600 mb-3" />
                <h3 className="text-sm font-semibold text-navy mb-1">
                  {item.label}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-slate-50 border border-slate-100 rounded-xl p-6 md:p-8">
            <h3 className="text-lg font-semibold text-navy mb-3">
              How the portfolio visualization works
            </h3>
            <div className="text-sm text-slate-600 space-y-3 leading-relaxed max-w-3xl">
              <p>
                Each patent family is represented as an organic 3D shape whose
                lobes correspond to different aspects of its claim scope. The
                shape of each family tells you at a glance where its protection
                is strongest.
              </p>
              <p>
                A translucent portfolio bubble wraps around all the families,
                showing the overall shape of your patent protection. Where the
                bubble bulges, your coverage is deep. Where it&rsquo;s thin,
                there may be room for additional filings.
              </p>
              <p>
                An AI patent analyst is built in &mdash; ask it anything about
                your portfolio and it will answer grounded in your actual filing
                data, citing specific patent numbers, claim text, and dates.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
