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
    <main style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", position: "relative" }}>

      {/* Global ambient background — fixed, scrolls cinematically */}
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background: `
          radial-gradient(ellipse 80% 50% at 70% 5%, rgba(42,51,243,0.07) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 20% 40%, rgba(80,60,200,0.05) 0%, transparent 55%),
          radial-gradient(ellipse 70% 40% at 50% 80%, rgba(42,51,243,0.04) 0%, transparent 60%)
        `,
      }} />

      {/* Grid background */}
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(107,143,248,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(107,143,248,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        pointerEvents: "none",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 10%, black 35%, transparent 55%)",
        maskImage: "linear-gradient(to bottom, transparent 0%, black 10%, black 35%, transparent 55%)",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />
        <div style={{ zoom: 0.91, display: "flex", flexDirection: "column", gap: "60px" }}>
          <HeroSection />
          <ServicesSection />
          <div style={{ height: "40px" }} />
          <AboutSection />
          <div style={{ height: "40px" }} />
        </div>
        <ProcessSection />
        <ProjectsSection />
        <div style={{ zoom: 0.91, display: "flex", flexDirection: "column", gap: "0px" }}>
          <CTASection />
        </div>
        <Footer />
      </div>

    </main>
  );
}
