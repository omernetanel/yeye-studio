"use client";

import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import Button from "@/components/ui/Button";

const SHOW_AFTER_SCROLL_PX = 500;

/**
 * Floating "start a project" bar pinned to the bottom on mobile — a
 * native high-conversion pattern, not shown on the contact page itself
 * (that page already is the conversion destination). Sits at a lower
 * z-index than the Navbar's bottom sheet, so the sheet's backdrop
 * naturally covers it when the mobile menu is open.
 */
export default function StickyMobileCTA() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const nearBottom = latest + window.innerHeight >= document.documentElement.scrollHeight - 80;
    setVisible(latest > SHOW_AFTER_SCROLL_PX && !nearBottom);
  });

  if (pathname === "/contact") return null;

  return (
    <motion.div
      initial={false}
      animate={{ y: visible ? 0 : "120%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
    >
      <Button href="/contact" variant="primary" showArrow={false} className="w-full justify-center py-3 text-[15px]">
        בוא נתחיל פרויקט
      </Button>
    </motion.div>
  );
}
