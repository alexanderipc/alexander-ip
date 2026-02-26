import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-navy to-navy-light">
      <Container>
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Tell me about your invention.
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed mb-4">
            Describe what you&apos;ve built and what you&apos;re trying to
            protect. Alexander IP will come back to you within 24&ndash;48 hours
            with honest advice on whether patent protection makes sense, what it
            would involve, and what it would cost.
          </p>
          <p className="text-slate-400 mb-8">
            If it&apos;s not something Alexander IP can help with, you&apos;ll
            be told &mdash; and pointed in the right direction.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button href="/contact" size="lg">
              Start Your Enquiry
            </Button>
            <Button
              href="/services/consultation"
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              Book a Consultation
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
