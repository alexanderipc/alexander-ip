import { MessageCircle, GraduationCap, User } from "lucide-react";
import Container from "@/components/ui/Container";

const differentiators = [
  {
    icon: MessageCircle,
    title: "Plain English, No Jargon",
    description:
      "Most patent firms communicate in legalese because it reinforces the mystique. Alexander IP does the opposite. You'll understand exactly what's happening with your application, why it matters, and what your options are — in language that actually makes sense.",
  },
  {
    icon: GraduationCap,
    title: "Top-Tier Training, Accessible Pricing",
    description:
      "Founded by a specialist trained at Kilburn & Strode, a Legal 500 intellectual property firm. You get the same quality of work, without the large-office overhead, partner profit margins, or junior associates. Just the expert doing the work.",
  },
  {
    icon: User,
    title: "Full Lifecycle Support",
    description:
      "No handoffs, no account managers, no junior associates picking up where someone else left off. A dedicated specialist from initial concept through to grant and beyond. Many of our clients come back with new inventions.",
  },
];

export default function WhyAlexanderIPC() {
  return (
    <section className="py-20 bg-slate-50">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
            Why Alexander IP?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            The patent industry doesn&apos;t cater well to startups and individual
            inventors. Alexander IP exists to change that.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {differentiators.map((item) => (
            <div key={item.title} className="text-center">
              <div className="w-14 h-14 bg-blue rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                <item.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-navy mb-3">
                {item.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
