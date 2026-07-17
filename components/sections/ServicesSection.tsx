"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Monitor, Rocket, ShoppingCart } from "lucide-react";
import ServiceCard from "@/components/ui/ServiceCard";
import SectionHeading from "@/components/ui/SectionHeading";
import SwipeCarousel from "@/components/ui/SwipeCarousel";

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
  return (
    <section id="services" className="px-6 py-16 md:py-20">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading title="מה אנחנו עושים?" className="mb-10 md:mb-14" />

        {/* Mobile: touch-native swipe carousel, one card at a time */}
        <SwipeCarousel className="sm:hidden">
          {services.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </SwipeCarousel>

        {/* Tablet/desktop: grid */}
        <div className="hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
            >
              <ServiceCard {...service} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
