import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="py-24 lg:py-32 bg-gradient-to-b from-slate-50 to-white">
      <Container>
        <div className="text-center max-w-lg mx-auto">
          <p className="text-6xl font-bold text-blue mb-4">404</p>
          <h1 className="text-3xl font-bold text-navy mb-4">
            Page not found
          </h1>
          <p className="text-slate-600 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. If you followed a link here, please get in touch and
            we&apos;ll point you in the right direction.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/">Back to Home</Button>
            <Button href="/contact" variant="outline">
              Get in Touch
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
