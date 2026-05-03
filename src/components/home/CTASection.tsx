import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-navy to-navy-light">
      <Container>
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Quickest way in: a 15-minute call.
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed mb-4">
            Pick a slot and we&rsquo;ll talk it through &mdash; whether your
            invention is patentable, what protection would involve, and what it
            would cost. No obligation, no juniors, straight to me.
          </p>
          <p className="text-slate-400 mb-8">
            Prefer to write? Send a written enquiry and I&rsquo;ll come back
            within 24&ndash;48 hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button href="/book-call" size="lg">
              Book a Free 15-min Call
            </Button>
            <Button
              href="/contact"
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              Send a Written Enquiry
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
