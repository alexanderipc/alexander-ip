import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import LocalizedPrice from "@/components/ui/LocalizedPrice";
import BookConsultationForm from "./BookConsultationForm";

export const metadata: Metadata = {
  title: "Book a 1-Hour Patent Consultation | Alexander IP",
  description:
    "Pick a 60-minute consultation slot to discuss your invention with Alexander Rowley. Includes patentability assessment and written summary. Full refund if it's not a fit.",
  robots: { index: true, follow: true },
};

export default function BookConsultationPage() {
  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-slate-50 to-white">
      <Container size="narrow">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-blue/10 text-blue-dark mb-4">
            Paid &middot; 60 minutes &middot; Full refund guarantee
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-4 leading-tight">
            Book a 1-Hour Patent Consultation
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Pick a slot, pay, and you&rsquo;ll get a calendar invite with a
            Google Meet link automatically. Patentability assessment, filing
            strategy, and a written summary to follow.
          </p>
          <p className="text-sm text-slate-500 mt-4">
            <span className="font-semibold text-navy">
              <LocalizedPrice
                service="consultation"
                fallback="From $112"
                prefix="From"
              />
            </span>{" "}
            &middot; full refund if I can&rsquo;t provide value
          </p>
        </div>

        <BookConsultationForm />

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
              Google Meet (link in your invite)
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Includes
            </p>
            <p className="text-sm text-slate-700">
              Written summary &amp; recommendations
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-10 max-w-md mx-auto">
          Not sure yet?{" "}
          <a
            href="/book-call"
            className="text-blue hover:text-blue-dark font-medium"
          >
            Book a free 15-min intro call instead
          </a>{" "}
          &mdash; we can decide together if a paid consultation is the right
          next step.
        </p>
      </Container>
    </section>
  );
}
