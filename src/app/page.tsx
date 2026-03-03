import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import ProcessPreview from "@/components/home/ProcessPreview";
import TrustBar from "@/components/home/TrustBar";
import WhoIsThisFor from "@/components/home/WhoIsThisFor";
import ServicesOverview from "@/components/home/ServicesOverview";
import PackageBuilderSection from "@/components/home/PackageBuilderSection";
import MidPageCTA from "@/components/home/MidPageCTA";
import WhyAlexanderIPC from "@/components/home/WhyAlexanderIPC";
import PatentMap from "@/components/home/PatentMap";
import Testimonials from "@/components/home/Testimonials";
import CTASection from "@/components/home/CTASection";

export const metadata: Metadata = {
  title:
    "Alexander IP — Affordable Patent Services for Inventors & Startups",
  description:
    "Patent drafting from $895, patent search from $300, filing from $225. Legal 500-trained specialist with 50+ patents granted and 800+ five-star reviews. Transparent pricing, personal service — built for individual inventors and startups, not corporations.",
};

export default function Home() {
  return (
    <>
      <Hero />
      <ProcessPreview />
      <TrustBar />
      <ServicesOverview />
      <PackageBuilderSection />
      <MidPageCTA />
      <PatentMap />
      <WhoIsThisFor />
      <WhyAlexanderIPC />
      <Testimonials />
      <CTASection />
    </>
  );
}
