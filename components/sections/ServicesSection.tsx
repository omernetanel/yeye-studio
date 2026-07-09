"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Rocket, Monitor, LayoutDashboard } from "lucide-react";
import ServiceCard from "@/components/ui/ServiceCard";

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
    <section id="services" style={{ backgroundColor: "transparent", padding: "20px 24px 50px", marginTop: "20px", scrollMarginTop: "160px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", direction: "rtl" }}>
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            fontFamily: "'GoogleSans', Arial, sans-serif",
            fontWeight: 700,
            fontSize: "34px",
            color: "white",
            textAlign: "center",
            marginBottom: "16px",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}
        >
          מה אנחנו עושים?
        </motion.h2>
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: "80px" }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          style={{
            height: "3px",
            background: "linear-gradient(90deg, #2a33f3, #6B8FF8)",
            borderRadius: "2px",
            margin: "0 auto 40px",
            overflow: "hidden",
          }}
        />

        {/* Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          direction: "rtl",
        }}>
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.1 }}
            >
              <ServiceCard
                icon={service.icon}
                title={service.title}
                description={service.description}
                href={service.href}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
