import { Metadata } from "next";
import Container from "@/components/ui/Container";
import Accordion from "@/components/ui/Accordion";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { faqItems, faqCategories } from "@/data/faq";

export const metadata: Metadata = {
  title: "FAQ | Alexander IP Consulting",
  description:
    "Common questions about patents, patentability, costs, timelines, and working with Alexander IP Consulting. Expert answers in plain English.",
};

function FAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function FAQPage() {
  const categories = faqCategories.filter((c) => c !== "All");

  return (
    <>
      <FAQSchema />

      {/* Hero */}
      <section className="py-16 lg:py-20 bg-gradient-to-b from-slate-50 to-white">
        <Container size="narrow">
          <div className="text-center">
            <Badge className="mb-6">FAQ</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-navy mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Answers to common questions about patents, the patent process,
              costs, and working with Alexander IP. Can&apos;t find what you&apos;re
              looking for? Get in touch.
            </p>
          </div>
        </Container>
      </section>

      {/* FAQ Sections */}
      <section className="py-16 bg-white">
        <Container size="narrow">
          {categories.map((category) => {
            const categoryItems = faqItems.filter(
              (item) => item.category === category
            );
            if (categoryItems.length === 0) return null;

            return (
              <div key={category} className="mb-12 last:mb-0">
                <h2 className="text-2xl font-bold text-navy mb-6">
                  {category}
                </h2>
                <Accordion
                  items={categoryItems.map((item) => ({
                    question: item.question,
                    answer: item.answer,
                  }))}
                />
              </div>
            );
          })}
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-50">
        <Container>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-navy mb-4">
              Still Have Questions?
            </h2>
            <p className="text-slate-600 mb-8 max-w-lg mx-auto">
              Get in touch and we&apos;ll be happy to help. No obligation, no
              pressure.
            </p>
            <Button href="/contact">Get in Touch</Button>
          </div>
        </Container>
      </section>
    </>
  );
}
