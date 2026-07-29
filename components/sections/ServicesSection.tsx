"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Monitor, Rocket, ShoppingCart } from "lucide-react";
import ServiceCard from "@/components/ui/ServiceCard";
import SectionHeading from "@/components/ui/SectionHeading";
import SwipeCarousel from "@/components/ui/SwipeCarousel";
import { useDocked } from "@/lib/motion/heroDock";
import { cn } from "@/lib/utils";

const services = [
  {
    icon: ShoppingCart,
    title: "חנויות אונליין",
    description: "חנויות מעוצבות ומדויקות\nעם חוויית קנייה שמביאה מכירות.",
    href: "/services/online-stores",
  },
  {
    icon: Rocket,
    title: "דפי נחיתה",
    description: "דפי נחיתה ממוקדים שממירים\nגולשים ללקוחות ומביאים תוצאות.",
    href: "/services/landing-pages",
  },
  {
    icon: Monitor,
    title: "אתרי תדמית",
    description: "אתרים יוקרתיים שבונים אמון\nומציגים את העסק שלך ברמה הגבוהה ביותר.",
    href: "/services/business-sites",
  },
  {
    icon: LayoutDashboard,
    title: "מערכות ניהול",
    description: "דשבורדים וכלי ניהול פנימיים\nשמסדרים את העסק שלך במקום אחד.",
    href: "/services/dashboards",
  },
];

export default function ServicesSection() {
  // Turns black the instant the Hero logo docks into the Navbar — the
  // same beat that ends the scroll-driven logo animation (see
  // lib/motion/heroDock.ts / HeroSection). Not its own scroll effect,
  // just a themed reaction to that shared moment.
  const docked = useDocked();

  return (
    <section
      id="services"
      className={cn("relative px-6 py-16 transition-colors duration-700 md:py-20", docked ? "bg-[#0a0a0a]" : "bg-transparent")}
    >
      <div className="relative z-10 mx-auto max-w-[1200px]">
        <SectionHeading title="מה אני עושה?" className="mb-12 md:mb-16" light={!docked} />

        {/* Mobile: touch-native swipe carousel, one card at a time */}
        <SwipeCarousel className="sm:hidden">
          {services.map((service) => (
            <ServiceCard key={service.title} {...service} light={!docked} />
          ))}
        </SwipeCarousel>

        {/* Tablet/desktop: grid */}
        <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
            >
              <ServiceCard {...service} light={!docked} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
