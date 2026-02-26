import { Star, Award, Globe, Clock, GraduationCap, Building2 } from "lucide-react";
import Container from "@/components/ui/Container";

const authority = [
  { icon: GraduationCap, label: "MSc Physics, University of Bristol" },
  { icon: Building2, label: "Legal 500 Trained (Kilburn & Strode)" },
  { icon: Clock, label: "10 Years in the Industry" },
];

const proofStats = [
  {
    icon: Star,
    value: "800+",
    label: "five-star reviews on Fiverr",
  },
  {
    icon: Award,
    value: "50+",
    label: "patents granted across US, UK, Europe, and Australia",
  },
  {
    icon: Globe,
    value: "155+",
    label: "PCT contracting states covered",
  },
];

export default function TrustBar() {
  return (
    <section className="bg-navy py-12">
      <Container>
        {/* Row 1: Authority markers */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-8 pb-8 border-b border-slate-700">
          {authority.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-slate-300"
            >
              <item.icon className="w-4 h-4 text-blue-light flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Row 2: Proof stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {proofStats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center"
            >
              <stat.icon className="w-6 h-6 text-blue-light mb-2" />
              <span className="text-2xl font-bold text-white">{stat.value}</span>
              <span className="text-sm text-slate-200">{stat.label}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
