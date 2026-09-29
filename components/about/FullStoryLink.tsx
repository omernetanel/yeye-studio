import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The way from the homepage's "who I am" to the about page. A text link, not a
 * button: the homepage's buttons are the ask. On black, in both layouts.
 */
export default function FullStoryLink({ className }: { className?: string }) {
  return (
    <Link
      href="/about"
      className={cn(
        "group inline-flex items-center gap-2 font-display text-[16px] font-bold text-white underline-offset-4 hover:underline md:text-[18px]",
        className,
      )}
    >
      לסיפור המלא
      <ArrowLeft
        aria-hidden
        size={17}
        strokeWidth={2}
        className="transition-transform duration-200 group-hover:-translate-x-1"
      />
    </Link>
  );
}
