import { MessageCircle, GraduationCap, User } from "lucide-react";
import Container from "@/components/ui/Container";

const differentiators = [
  {
    icon: MessageCircle,
    title: "Communication You Can Actually Understand",
    description:
      "Alexander IP explains exactly what's happening with your application, why it matters, and what your options are. No legalese, no jargon, no assumptions about what you already know. Every decision is explained in plain English.",
  },
  {
    icon: GraduationCap,
    title: "Legal 500 Training, Lean Business Model",
    description:
      "Founded by a specialist trained at Kilburn & Strode, a top-tier Legal 500 IP firm. The same calibre of work, without the central London office, partner profit margins, or layers of administration. The expert doing the work is the only person you deal with.",
  },
  {
    icon: User,
    title: "One Specialist, Start to Finish",
    description:
      "No handoffs, no account managers, no junior associates learning on your file. Alexander IP handles every stage personally — from initial consultation through to granted patent. Many clients come back with their second, third, or sixth invention.",
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
            Traditional firms charge what they charge because of overhead:
            offices, partners, junior associates, account managers. At
            Alexander IP, the pricing comes from a different business model.
            The quality comes from rigorous training and 10 years of
            high-volume practice.
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
