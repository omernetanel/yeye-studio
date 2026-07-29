"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { useDocked } from "@/lib/motion/heroDock";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "עבודות", href: "/#projects" },
  { label: "שירותים", href: "/#services" },
  { label: "אודות", href: "/#about" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const docked = useDocked();

  useEffect(() => {
    if (!menuOpen) return;

    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed inset-x-0 top-0 z-50 border-b border-black/8 bg-white"
      >
      <div className="relative mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-6">
        {/* Logo — pinned to the visual left, brand-convention regardless of RTL.
            Hidden until the Hero's own pin releases (see lib/motion/heroDock.ts),
            at which point it just crossfades in on its own — tabIndex keeps
            keyboard focus off an invisible link before that happens. */}
        <Link
          href="/"
          tabIndex={docked ? 0 : -1}
          className={cn("absolute left-6 top-1/2 flex -translate-y-1/2 items-center transition-opacity duration-200", docked ? "opacity-100" : "opacity-0")}
        >
          <span className="inline-block">
            <Image
              src="/images/logo.png"
              alt="YEYE Labs"
              width={80}
              height={26}
              className="h-6 w-auto object-contain brightness-0"
              priority
            />
          </span>
        </Link>

        {/* Nav links — centered, desktop only */}
        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-9 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative pb-1 font-display text-[15px] font-medium text-black/62 transition-colors hover:text-accent"
            >
              {link.label}
              <span className="absolute inset-x-0 -bottom-1.5 h-0.5 origin-center scale-x-0 rounded-full bg-[image:var(--gradient-brand)] transition-transform duration-300 ease-out group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        {/* CTA — desktop only, pinned right */}
        <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 md:block">
          <Button href="/contact" variant="primary" className="!border-black !bg-none !bg-black !shadow-none px-4 py-2 text-[13px]">
            צרו קשר
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "סגור תפריט" : "פתח תפריט"}
          aria-expanded={menuOpen}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-black/80 md:hidden"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      </motion.header>

      {/* Mobile menu — bottom sheet, native-feeling instead of a top dropdown.
          Rendered as a sibling of motion.header, not a descendant: Framer
          Motion leaves a `transform` style on animated elements even at
          rest, and any transformed ancestor turns into a containing block
          for position:fixed descendants — which silently breaks "fixed"
          positioning (it anchors to the header's box instead of the
          viewport) if this sheet lived inside the header. */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.nav
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              role="dialog"
              aria-modal="true"
              aria-label="תפריט ניווט"
              className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-black/10 bg-white pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(0,0,0,0.15)] md:hidden"
            >
              <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-black/15" />
              <div className="flex flex-col gap-1 px-6 pt-5">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-3 py-4 font-display text-lg font-medium text-black/80 transition-colors active:bg-black/5"
                  >
                    {link.label}
                  </Link>
                ))}
                <Button
                  href="/contact"
                  variant="primary"
                  showArrow={false}
                  className="!border-black !bg-none !bg-black !shadow-none mt-3 justify-center py-3.5 text-base"
                >
                  צרו קשר
                </Button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
