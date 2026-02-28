import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function MidPageCTA() {
  return (
    <section className="py-14 bg-navy">
      <Container>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              Know what you need?
            </h3>
            <p className="text-slate-400 text-sm">
              Get in touch with your project details and receive a response
              within 24&ndash;48 hours.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Button href="/contact" size="md">
              Tell Me About Your Invention
            </Button>
            <Button
              href="/services/consultation"
              variant="outline"
              size="md"
              className="border-slate-500 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Book a Consultation
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
