"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesStrip from "@/components/landing/FeaturesStrip";
import SplitSections from "@/components/landing/SplitSections";
import ProcessTimeline from "@/components/landing/ProcessTimeline";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f6f3eb]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-800 mx-auto mb-4"></div>
          <p className="text-teal-900 font-medium">Initializing Alumnex Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f3eb] text-[#111827] selection:bg-teal-700 selection:text-white font-sans antialiased">
      <Header user={user} />
      <HeroSection />
      <FeaturesStrip />
      <SplitSections />
      <ProcessTimeline />
      <TestimonialsSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
