import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import ServicesSection from "@/components/sections/ServicesSection";
import AboutSection from "@/components/sections/AboutSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import ProcessSection from "@/components/sections/ProcessSection";
import CTASection from "@/components/sections/CTASection";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-background">
      {/* Ambient background — fixed, scrolls cinematically underneath every section */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 70% 5%, color-mix(in srgb, var(--color-primary) 7%, transparent) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 20% 40%, color-mix(in srgb, var(--color-primary-light) 5%, transparent) 0%, transparent 55%),
            radial-gradient(ellipse 70% 40% at 50% 80%, color-mix(in srgb, var(--color-primary) 4%, transparent) 0%, transparent 60%)
          `,
        }}
      />

      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[size:60px_60px]"
        style={{
          backgroundImage: `
            linear-gradient(color-mix(in srgb, var(--color-primary-light) 4%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in srgb, var(--color-primary-light) 4%, transparent) 1px, transparent 1px)
          `,
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 10%, black 35%, transparent 55%)",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 10%, black 35%, transparent 55%)",
        }}
      />

      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <ServicesSection />
        <AboutSection />
        <ProcessSection />
        <ProjectsSection />
        <CTASection />
        <Footer />
      </div>
    </main>
  );
}
