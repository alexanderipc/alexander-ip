import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import BookCallForm from "./BookCallForm";

export const metadata: Metadata = {
  title: "Book a Free 15-min Intro Call | Alexander IP",
  description:
    "Pick a 15-minute slot to discuss your invention with Alexander Rowley. No obligation. UK business hours.",
  robots: { index: true, follow: true },
};

export default function BookCallPage() {
  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-slate-50 to-white">
      <Container size="narrow">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-blue/10 text-blue-dark mb-4">
            Free &middot; 15 minutes &middot; No obligation
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-4 leading-tight">
            Request a Free Intro Call
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Quick chat to see if I&rsquo;m the right fit for your invention &mdash;
            and to ballpark timelines and pricing. Straight to me, no juniors.
          </p>
          <p className="text-sm text-slate-500 max-w-xl mx-auto mt-3">
            Pick a slot and tell me a bit about your project. I review every
            request personally and confirm within one working day &mdash; usually
            much sooner.
          </p>
        </div>

        <BookCallForm />

        <div className="mt-12 grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              When
            </p>
            <p className="text-sm text-slate-700">
              Mon&ndash;Fri, 10:00&ndash;17:00 UK
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              How
            </p>
            <p className="text-sm text-slate-700">
              Google Meet (link sent once approved)
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              For
            </p>
            <p className="text-sm text-slate-700">
              Inventors, founders, returning clients
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-10 max-w-md mx-auto">
          Want a deeper deliverable instead? A{" "}
          <a
            href="/services/consultation"
            className="text-blue hover:text-blue-dark font-medium"
          >
            paid consultation (&pound;85)
          </a>{" "}
          gives you a full patentability assessment with a written report.
        </p>
      </Container>
    </section>
  );
}
