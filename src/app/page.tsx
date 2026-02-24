import Hero from "@/components/home/Hero";
import TrustBar from "@/components/home/TrustBar";
import ServicesOverview from "@/components/home/ServicesOverview";
import WhyAlexanderIPC from "@/components/home/WhyAlexanderIPC";
import WhyWorkDirect from "@/components/home/WhyWorkDirect";
import Testimonials from "@/components/home/Testimonials";
import ProcessPreview from "@/components/home/ProcessPreview";
import CTASection from "@/components/home/CTASection";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <ServicesOverview />
      <WhyAlexanderIPC />
      <ProcessPreview />
      <Testimonials />
      <WhyWorkDirect />
      <CTASection />
    </>
  );
}
