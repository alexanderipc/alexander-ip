import Hero from "@/components/home/Hero";
import VideoSection from "@/components/home/VideoSection";
import TrustBar from "@/components/home/TrustBar";
import WhoIsThisFor from "@/components/home/WhoIsThisFor";
import ServicesOverview from "@/components/home/ServicesOverview";
import WhyAlexanderIPC from "@/components/home/WhyAlexanderIPC";
import PatentMap from "@/components/home/PatentMap";
import Testimonials from "@/components/home/Testimonials";
import CTASection from "@/components/home/CTASection";

export default function Home() {
  return (
    <>
      <Hero />
      <VideoSection />
      <TrustBar />
      <WhoIsThisFor />
      <ServicesOverview />
      <WhyAlexanderIPC />
      <PatentMap />
      <Testimonials />
      <CTASection />
    </>
  );
}
