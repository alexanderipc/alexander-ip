import Container from "@/components/ui/Container";
import PackageBuilder from "@/components/services/PackageBuilder";

export default function PackageBuilderSection() {
  return (
    <section id="build-package" className="py-20 bg-slate-50 scroll-mt-8">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
            Build Your Patent Drafting Package
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Select the complexity of your invention, choose any optional
            extras, and pick a delivery timeline. Your total updates live as
            you configure.
          </p>
        </div>
        <PackageBuilder />
      </Container>
    </section>
  );
}
