import { MessageSquare, Search, FileText, Send, Award } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

const steps = [
  {
    icon: MessageSquare,
    label: "Enquire",
    description: "Tell me about your invention",
  },
  {
    icon: Search,
    label: "Search",
    description: "Assess patentability",
  },
  {
    icon: FileText,
    label: "Draft",
    description: "Full patent application",
  },
  {
    icon: Send,
    label: "File",
    description: "Submit to patent office",
  },
  {
    icon: Award,
    label: "Grant",
    description: "Patent protection secured",
  },
];

export default function ProcessPreview() {
  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
            How It Works
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From initial idea to granted patent — a clear, structured process
            with expert guidance at every step.
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 mb-12">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center text-center w-32">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 shadow-md ${
                    i === steps.length - 1
                      ? "bg-teal text-white"
                      : "bg-navy text-teal"
                  }`}
                >
                  <step.icon className="w-6 h-6" />
                </div>
                <span className="font-semibold text-navy text-sm">
                  {step.label}
                </span>
                <span className="text-xs text-slate-500 mt-0.5">
                  {step.description}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block w-12 h-px bg-slate-300 mx-2" />
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button href="/process" variant="outline">
            See Full Process Details
          </Button>
        </div>
      </Container>
    </section>
  );
}
