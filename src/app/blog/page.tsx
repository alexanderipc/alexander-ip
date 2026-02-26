import { Metadata } from "next";
import { FileText, ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Blog | Alexander IP Consulting",
  description:
    "Expert insights on patent law, IP strategy, and protecting your inventions. Articles by Alexander Rowley.",
};

const upcomingTopics = [
  {
    title: "How Much Does a Patent Cost in 2026?",
    description:
      "A transparent breakdown of patent costs including professional fees, government fees, and what affects pricing.",
    category: "Pricing",
  },
  {
    title: "Provisional vs Non-Provisional Patent: What\u2019s the Difference?",
    description:
      "Understanding the two types of US patent applications and when to use each.",
    category: "Basics",
  },
  {
    title: "PCT Applications Explained",
    description:
      "Your complete guide to international patent protection through the Patent Cooperation Treaty.",
    category: "International",
  },
  {
    title: "Do I Need a Patent Search Before Filing?",
    description:
      "Why a prior art search could save you thousands and strengthen your patent.",
    category: "Strategy",
  },
];

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-20 bg-gradient-to-b from-slate-50 to-white">
        <Container size="narrow">
          <div className="text-center">
            <Badge className="mb-6">Blog</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-navy mb-4">
              Insights &amp; Guides
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Expert articles on patent law, IP strategy, and protecting your
              inventions. Written by Alexander Rowley.
            </p>
          </div>
        </Container>
      </section>

      {/* Coming Soon */}
      <section className="py-16 bg-white">
        <Container size="narrow">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-navy/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-navy/40" />
            </div>
            <h2 className="text-2xl font-bold text-navy mb-2">
              Coming Soon
            </h2>
            <p className="text-slate-600 max-w-lg mx-auto">
              We&apos;re working on in-depth articles covering the most common
              questions we receive from clients. Here&apos;s what&apos;s in the pipeline:
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {upcomingTopics.map((topic) => (
              <Card key={topic.title} padding="lg" className="flex flex-col">
                <Badge variant="slate" className="self-start mb-3">
                  {topic.category}
                </Badge>
                <h3 className="text-lg font-semibold text-navy mb-2">
                  {topic.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {topic.description}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-50">
        <Container>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-navy mb-4">
              Have a Question About Patents?
            </h2>
            <p className="text-slate-600 mb-8 max-w-lg mx-auto">
              Check the FAQ for immediate answers, or get in touch for
              personalised advice.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button href="/faq" variant="outline">
                View FAQ
              </Button>
              <Button href="/contact">Get in Touch</Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
