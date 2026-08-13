import { headers } from "next/headers";
import HomeSwitch from "@/components/home/HomeSwitch";
import MobileHome from "@/components/home/MobileHome";
import { isMobileUserAgent } from "@/lib/device";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import StatementSection from "@/components/sections/StatementSection";
import ServicesSection from "@/components/sections/ServicesSection";
import ContactStage from "@/components/sections/ContactStage";
import AboutSection from "@/components/sections/AboutSection";
import ProjectsSection from "@/components/sections/ProjectsSection";
import CTASection from "@/components/sections/CTASection";

/**
 * Reading the user agent opts this page out of static generation, which is the
 * price of not sending every phone a desktop page it has to throw away.
 */
export default async function Home() {
  const serverIsMobile = isMobileUserAgent((await headers()).get("user-agent"));

  return (
    <main className="relative min-h-screen bg-white">
      {/* Ambient background — fixed, scrolls cinematically underneath every section.
          Shared at the page level (rather than repeated per-section) so it reads as
          one continuous backdrop instead of restarting at every section boundary;
          sections must stay transparent for it to actually show through. */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 70% 5%, color-mix(in srgb, var(--color-accent) 2.5%, transparent) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 20% 40%, color-mix(in srgb, var(--color-accent-light) 2%, transparent) 0%, transparent 55%),
            radial-gradient(ellipse 70% 40% at 50% 80%, color-mix(in srgb, var(--color-accent) 1.5%, transparent) 0%, transparent 60%)
          `,
        }}
      />

      <div className="relative z-10">
        <HomeSwitch serverIsMobile={serverIsMobile} mobile={<MobileHome />}>
          <Navbar />
          <HeroSection />
          <ServicesSection />
          {/* Sits between the paper sequence and the contact stage rather than
              before the paper: after a long pinned run it reads as a breath and
              a summary of what was just shown, where ahead of it it interrupted
              the page before anything had happened yet. */}
          <StatementSection />
          <AboutSection />
          {/* The contact stage carries a real form, so where it sits is a
              question of when the page has earned the right to ask. Ahead of
              "who I am" it was asking a stranger for their phone number on the
              strength of a film: they had seen WHAT is made here and nothing
              about who makes it. After it, the request leans on the section
              that was written to be leaned on.

              Not after the work, though — that would be the stronger pitch, but
              the page closes on a second form by design, and moving this one to
              the end would stack the two asks together and leave no early exit
              for anyone already convinced.

              It also happens to be the cleaner run of colour: the black of "who
              I am" hands straight to the dark footage this opens on, and the
              white room it ends in hands to the white of the work. */}
          <ContactStage />
          <ProjectsSection />
          <CTASection />
          <Footer light />
        </HomeSwitch>
      </div>
    </main>
  );
}
