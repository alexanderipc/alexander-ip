"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, ExternalLink } from "lucide-react";
import Container from "@/components/ui/Container";
import { testimonials } from "@/data/testimonials";

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % testimonials.length),
    []
  );
  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length),
    []
  );

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  }

  // Touch swipe handlers
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
    touchStartX.current = null;
  }

  return (
    <section className="py-20 bg-slate-50">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
            What Clients Say
          </h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-5 h-5 text-amber fill-amber"
              />
            ))}
          </div>
          <p className="text-slate-600">
            Rated 5 stars across 800+ reviews on{" "}
            <a
              href="https://www.fiverr.com/alexander_ip"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue hover:text-blue-dark inline-flex items-center gap-1"
            >
              Fiverr
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </p>
        </div>

        {/* Testimonial card */}
        <div
          className="max-w-3xl mx-auto"
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          tabIndex={0}
          role="region"
          aria-label="Client testimonials"
          aria-roledescription="carousel"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-10 relative">
            {/* Quote mark */}
            <div className="absolute top-6 left-8 text-6xl text-blue/10 font-serif leading-none">
              &ldquo;
            </div>

            <blockquote className="relative z-10" aria-live="polite">
              <p className="text-lg md:text-xl text-slate-700 leading-relaxed italic mb-6">
                &ldquo;{testimonials[current].quote}&rdquo;
              </p>
              <footer className="flex items-center justify-between">
                <div>
                  <cite className="not-italic font-semibold text-navy block">
                    {testimonials[current].attribution}
                  </cite>
                  <span className="text-sm text-slate-500">
                    {testimonials[current].service}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={prev}
                    className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <button
                    onClick={next}
                    className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </footer>
            </blockquote>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === current ? "bg-blue w-6" : "bg-slate-300"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>

          {/* Returning clients nudge */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Worked with us on Fiverr?{" "}
            <Link
              href="/returning-clients"
              className="text-blue hover:text-blue-dark font-medium"
            >
              See benefits of working direct &rarr;
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
