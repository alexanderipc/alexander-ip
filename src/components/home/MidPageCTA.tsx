import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function MidPageCTA() {
  return (
    <section className="py-14 bg-navy">
      <Container>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              Want to discuss before committing?
            </h3>
            <p className="text-slate-400 text-sm">
              Free 15-min intro call, or send me the details by email
              &mdash; I&rsquo;ll personally reply within 24&ndash;48 hours.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Button href="/book-call" size="md">
              Book Free 15-min Call
            </Button>
            <Button href="/contact" variant="outline" size="md" className="border-slate-500 text-slate-300 hover:bg-slate-700 hover:text-white">
              Email an Enquiry
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
