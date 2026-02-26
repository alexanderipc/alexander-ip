import Image from "next/image";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import LocalizedPrice from "@/components/ui/LocalizedPrice";
import PatentDiagramBackground from "@/components/ui/PatentDiagramBackground";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-16 lg:py-24">
      {/* Patent diagram background layer */}
      <PatentDiagramBackground />

      {/* Color wash overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-navy/5 rounded-full blur-3xl" />
      </div>

      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text content */}
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-blue/10 text-blue-dark rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-blue rounded-full" />
              Trained at a top Legal 500 firm &middot; 800+ five-star reviews &middot; 30+ patents granted across 6 jurisdictions
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-navy leading-[1.1] mb-6">
              Patent protection that
              <br />
              <span className="text-blue">doesn&apos;t require a corporate</span>
              <br />
              budget or a law degree
              <br />
              to understand
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed mb-4 max-w-xl">
              <span className="font-semibold text-navy">Most traditional firms charge{" "}
              <LocalizedPrice range={[8000, 15000]} fallback="$8,000–$15,000" /></span>{" "}
              for a single US utility patent application.
              With me, a typical patent package &mdash; including search, drafting,
              illustrations, and filing &mdash; costs{" "}
              <span className="font-semibold text-navy"><LocalizedPrice range={[1500, 2500]} fallback="$1,500–$2,500" /></span>{" "}
              depending on complexity. Same calibre of work, trained at a leading
              Legal&nbsp;500 firm.
            </p>

            <p className="text-base text-slate-500 leading-relaxed mb-8 max-w-xl">
              Every service has a clear, fixed fee calculated using a transparent
              pricing formula &mdash; so you always know exactly what you&apos;re
              paying before you commit. No jargon, no hourly billing, no surprises.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button href="/contact" size="lg">
                Get Started
              </Button>
              <Button href="/services" variant="outline" size="lg">
                View Services &amp; Pricing
              </Button>
            </div>
          </div>

          {/* Right: Photo + Video */}
          <div className="animate-fade-in-up-delay-2">
            <div className="relative">
              {/* Headshot with decorative frame */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/alexander-headshot.png"
                  alt="Alexander Rowley — Patent Specialist"
                  width={600}
                  height={600}
                  className="w-full h-auto object-cover"
                  priority
                />
                {/* Subtle overlay gradient at bottom */}
                <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-navy/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-semibold text-lg">
                    Alexander Rowley
                  </p>
                  <p className="text-slate-200 text-sm">
                    MSc Physics &middot; Legal 500 Trained &middot; Patent
                    Specialist
                  </p>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-navy/5 rounded-full blur-2xl" />
              {/* PATENTED stamp watermark */}
              <div className="absolute -top-3 -right-3 w-20 h-20 opacity-20">
                <Image
                  src="/images/patented-stamp.svg"
                  alt=""
                  width={80}
                  height={80}
                  className="w-full h-full"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
