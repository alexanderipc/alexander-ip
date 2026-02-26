import { Play } from "lucide-react";
import Container from "@/components/ui/Container";

export default function VideoSection() {
  return (
    <section className="py-16 bg-white">
      <Container>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-3">
              See how it works
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              A short introduction to Alexander IP &mdash; how the consultancy
              works, what the patent process looks like, and why the model is
              different.
            </p>
          </div>

          {/* Video placeholder — replace with YouTube embed when ready */}
          <div className="relative aspect-video bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-blue/40 transition-colors">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue/20 transition-colors">
                <Play className="w-8 h-8 text-blue ml-1" />
              </div>
              <p className="text-slate-500 font-medium">
                Video coming soon
              </p>
              <p className="text-sm text-slate-400 mt-1">
                How patent protection actually works (3 min)
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
