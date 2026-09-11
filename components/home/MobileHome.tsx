import Navbar from "@/components/layout/Navbar";
import NavMenu from "@/components/layout/NavMenu";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import MobileServices from "@/components/sections/mobile/MobileServices";
import ContactStage from "@/components/sections/ContactStage";
import MobileAbout from "@/components/sections/mobile/MobileAbout";
import MobileProjects from "@/components/sections/mobile/MobileProjects";
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
      <NavMenu />
      <WhatsAppButton />
      <HeroSection />
      {/* No StatementSection here. It exists to carry the closing line on the
          versions whose paper sequence cannot, and this one ends on that line
          itself — rendering both would show the sentence twice. */}
      <MobileServices />
      <MobileAbout />
      {/* Contact stage after "who I am" and before the work — see the note in
          app/page.tsx. */}
      <ContactStage />
      <MobileProjects />
      <CTASection />
      <Footer light />
    </>
  );
}
