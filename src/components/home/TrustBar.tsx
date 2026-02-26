import { Star, Award, Globe, Clock } from "lucide-react";
import Container from "@/components/ui/Container";

const stats = [
  {
    icon: Star,
    value: "800+",
    label: "Five-Star Reviews",
  },
  {
    icon: Award,
    value: "30+",
    label: "Patents Granted",
  },
  {
    icon: Globe,
    value: "140+",
    label: "Jurisdictions via PCT",
  },
  {
    icon: Clock,
    value: "10",
    label: "Years in the Industry",
  },
];

export default function TrustBar() {
  return (
    <section className="bg-navy py-12">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat) => (
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
