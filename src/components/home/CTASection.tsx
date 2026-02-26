import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import LocalizedPrice from "@/components/ui/LocalizedPrice";

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-navy to-navy-light">
      <Container>
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Protect Your Invention?
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed mb-8">
            Get in touch with a brief description of your invention and
            we&apos;ll come back to you with tailored advice on the best path
            forward. Typically within 24&ndash;48 hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button href="/contact" size="lg">
              Start Your Enquiry
            </Button>
            <Button href="/services/consultation" variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
              Book a Consultation (<LocalizedPrice service="consultation" fallback="$125" />)
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
