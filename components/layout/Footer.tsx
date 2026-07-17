import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";

const WHATSAPP_NUMBER = "972552434775";
const CONTACT_EMAIL = "hello@yeyelabs.com";

export default function Footer() {
  return (
    <footer className="border-t border-white/6">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 px-6 py-8 text-center md:grid md:h-20 md:grid-cols-3 md:items-center md:py-0 md:text-inherit">
        {/* Social — first in DOM sits rightmost under dir="rtl" */}
        <div className="flex items-center gap-5">
          <Link
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="flex text-white/45 transition-colors hover:text-primary-light"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </Link>
          <Link
            href={`mailto:${CONTACT_EMAIL}`}
            aria-label="Email"
            className="flex text-white/45 transition-colors hover:text-primary-light"
          >
            <Mail size={20} strokeWidth={1.5} />
          </Link>
        </div>

        {/* Logo + wordmark — center */}
        <div className="flex flex-col items-center gap-1">
          <Image
            src="/images/logo.png"
            alt="YEYE Labs"
            width={56}
            height={20}
            className="h-5 w-auto brightness-0 invert-[0.35]"
          />
          <span className="font-display text-[10px] font-normal tracking-[0.2em] text-white/35 uppercase">
            LABS
          </span>
        </div>

        {/* Copyright */}
        <div className="font-display text-[13px] text-white/35">© 2026 YEYE LABS. כל הזכויות שמורות.</div>
      </div>
    </footer>
  );
}
