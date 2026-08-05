import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import ServicesSection from "@/components/sections/ServicesSection";
import StatementSection from "@/components/sections/StatementSection";
import ContactStage from "@/components/sections/ContactStage";
import ProcessSection from "@/components/sections/ProcessSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import CTASection from "@/components/sections/CTASection";

/**
 * The mobile page, listed section by section.
 *
 * It starts out as the same list the desktop renders, so switching to it
 * changes nothing on screen. Each entry is swapped for a dedicated mobile
 * component as that section gets rebuilt, which keeps the page whole at every
 * step rather than leaving a half-built version live.
 */
export default function MobileHome() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <StatementSection />
      <ContactStage />
      <ProcessSection />
      <ProjectsSection />
      <CTASection />
      <Footer light />
    </>
  );
}
