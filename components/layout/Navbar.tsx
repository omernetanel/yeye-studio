"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "עבודות", href: "/#projects" },
  { label: "שירותים", href: "/#services" },
  { label: "אודות", href: "/#about" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/6 bg-background/85 backdrop-blur-md"
    >
      <div className="relative mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-6">
        {/* Logo — pinned to the visual left, brand-convention regardless of RTL */}
        <Link href="/" className="absolute left-6 top-1/2 flex -translate-y-1/2 items-center">
          <Image
            src="/images/logo.png"
            alt="YEYE Labs"
            width={80}
            height={26}
            className="h-6 w-auto object-contain brightness-[10]"
            priority
          />
        </Link>

        {/* Nav links — centered, desktop only */}
        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-9 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative pb-1 font-display text-[15px] font-medium text-white/62 transition-colors hover:text-primary-light"
            >
              {link.label}
              <span className="absolute inset-x-0 -bottom-1.5 h-0.5 origin-center scale-x-0 rounded-full bg-[image:var(--gradient-brand)] transition-transform duration-300 ease-out group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        {/* CTA — desktop only, pinned right */}
        <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 md:block">
          <Button href="/contact" variant="primary" className="px-4 py-2 text-[13px]">
            התחל פרויקט
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "סגור תפריט" : "פתח תפריט"}
          aria-expanded={menuOpen}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-white/80 md:hidden"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn("overflow-hidden border-t border-white/6 bg-background/95 backdrop-blur-md md:hidden")}
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-2 py-3 font-display text-base font-medium text-white/75 transition-colors hover:bg-white/5 hover:text-primary-light"
                >
                  {link.label}
                </Link>
              ))}
              <Button href="/contact" variant="primary" showArrow={false} className="mt-2 justify-center">
                התחל פרויקט
              </Button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
