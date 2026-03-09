import { Metadata } from "next";
import { Beaker, Box, Brain, Layers, ExternalLink } from "lucide-react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import PatentExplorer from "@/components/workshop/PatentExplorer";

export const metadata: Metadata = {
  title: "Tinker’s Workshop | Alexander IP",
  description:
    "Experimental tools built by Alexander IP. Explore the Portfolio Explorer — see the shape of your patent protection at a glance with interactive 3D visualization and AI-powered analysis.",
};

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
            <Badge variant="teal">Experimental</Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-navy mt-4 mb-4">
              Tinker&rsquo;s Workshop
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Where patent meets protocol. These are experimental tools I&rsquo;m
              building to explore new ways of visualizing, verifying, and
              understanding intellectual property.
            </p>
          </div>
        </Container>
      </section>

      {/* Portfolio Explorer */}
      <section className="py-10 md:py-14">
        <Container size="wide">
          {/* Project header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-navy">
                  Portfolio Explorer
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-slate-500 text-sm max-w-2xl">
                See the shape of your patent protection at a glance. Each patent
                family&rsquo;s shape is formed by its claim scope, and the portfolio
                bubble shows how they combine into total coverage.
              </p>
            </div>
            <a
              href="/explorer"
              className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium whitespace-nowrap transition-colors"
            >
              Open Full Screen
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Explorer embed */}
          <PatentExplorer />

          {/* Tech stack cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
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

          {/* How it works callout */}
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
