import { Lightbulb, Rocket, Building, Globe } from "lucide-react";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";

const audiences = [
  {
    icon: Lightbulb,
    title: "Individual Inventors",
    description:
      "You've built something worth protecting and you want expert help without the corporate overhead. Whether it's your first patent or your sixth, you get the same direct access to the specialist doing the work.",
  },
  {
    icon: Rocket,
    title: "Startups & Early-Stage Companies",
    description:
      "You need IP protection to attract investment or defend your market position, but you're not at the stage where a large firm's fees make sense. You want proper expertise at a price that reflects your reality.",
  },
  {
    icon: Building,
    title: "Small & Medium Businesses",
    description:
      "You've been selling a product and need to protect it, or you've received an office action and need someone to fight your corner. You want a dedicated specialist, not a different associate every time you call.",
  },
  {
    icon: Globe,
    title: "Expanding Internationally",
    description:
      "You have granted patents and want to extend protection to new countries. You want clear advice on where it's worth filing and a single point of contact who handles everything.",
  },
];

export default function WhoIsThisFor() {
  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
            Who Alexander IP works with
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            The patent industry is structurally built for large applicants with
            big portfolios. Alexander IP was founded to serve the people it
            overlooks.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {audiences.map((item) => (
            <Card key={item.title} hover padding="lg">
              <div className="flex gap-4">
                <div className="w-11 h-11 bg-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-navy mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-[15px]">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-10 max-w-2xl mx-auto">
          <p className="text-sm text-slate-500 text-center leading-relaxed">
            If you're a large corporation looking for a firm to manage a
            500-patent portfolio with a team of associates, Alexander IP
            probably isn't the right fit. This practice is built around personal
            service and direct access to the specialist doing the work &mdash;
            that model doesn't scale to enterprise volume, by design.
          </p>
        </div>
      </Container>
    </section>
  );
}
