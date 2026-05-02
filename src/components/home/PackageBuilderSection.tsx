import Container from "@/components/ui/Container";
import PackageBuilder from "@/components/services/PackageBuilder";

export default function PackageBuilderSection() {
  return (
    <section id="build-package" className="pt-10 pb-20 bg-white scroll-mt-8">
      <Container>
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
            Build Your Patent Drafting Package
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Select the complexity of your invention, choose any optional
            extras, and pick a delivery timeline. Your total updates live as
            you configure.
          </p>
        </div>

        {/* Price-anchor banner */}
        <div className="max-w-3xl mx-auto mb-10 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-100 rounded-xl p-5 text-center">
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            <span className="font-semibold text-navy">£8,000&ndash;£15,000</span>{" "}
            at a traditional patent firm.{" "}
            <span className="font-semibold text-navy">£695&ndash;£2,000 with me</span>{" "}
            &mdash; most full packages land between &pound;1,500 and &pound;2,000.
            <br className="hidden sm:block" />
            <span className="text-slate-500">
              Same Legal&nbsp;500 training, same outcome &mdash; different overhead.
            </span>
          </p>
        </div>

        <PackageBuilder />
      </Container>
    </section>
  );
}
