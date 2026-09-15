import Link from "next/link";
import { ArrowLeft, Layers, PenTool, Rocket, ShoppingBag } from "lucide-react";
import { services } from "@/lib/content";
import { cn } from "@/lib/utils";

// The words live in lib/content; the icons live with the row, because they
// belong to this row design and nothing else draws them.
const SERVICE_ICONS = [ShoppingBag, Rocket, Layers, PenTool];

// Every row hovers to the same grey. It used to be a different accent per row,
// which fought the black-and-white section around it; a single neutral reads as
// a hover state rather than as four unrelated brand colours.
// Literal class strings (not built from interpolation) so Tailwind's JIT
// scanner — which only ever detects classes it can see verbatim in the
// source — actually generates these arbitrary-color utilities.
const ROW_HOVER_TEXT_CLASS = "group-hover:text-[#8A8A8A]";
const ROW_HOVER_BORDER_CLASS = "group-hover:border-[#8A8A8A]";

interface ServiceRowProps {
  service: (typeof services)[number];
  index: number;
  /**
   * The phone's size of the same row: the same numeral, divider, icon, title,
   * sentence and arrow, scaled to a column a third as wide. The desktop's own
   * sizes at 375px would put the title and its sentence on four lines each.
   */
  compact?: boolean;
  className?: string;
}

/**
 * One service as a row — numeral, icon, title with the sentence under it, arrow.
 *
 * Shared by both layouts so the phone prints exactly what the desktop prints,
 * rather than a second, lighter version of the list that would drift from it.
 */
export default function ServiceRow({ service, index, compact = false, className }: ServiceRowProps) {
  const Icon = SERVICE_ICONS[index];
  return (
    <Link
      href={service.href}
      className={cn(
        "group flex items-center justify-between border-b border-black/8 last:border-b-0",
        compact ? "gap-3 py-3" : "gap-6 py-5 pe-10 first:pt-0",
        className
      )}
    >
      <div className={cn("flex items-center", compact ? "gap-3" : "gap-5")}>
        <span
          className={cn(
            "font-display font-bold text-black transition-colors duration-200",
            compact ? "text-m-lead" : "text-5xl",
            // After the size, never before it: a text-* size also sets a line
            // height, and cn keeps whichever of the two comes last.
            "leading-none",
            ROW_HOVER_TEXT_CLASS
          )}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="w-px self-stretch bg-black/10" />
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/[0.02] transition-colors duration-200",
            compact ? "h-10 w-10" : "h-12 w-12",
            ROW_HOVER_BORDER_CLASS
          )}
        >
          <Icon
            size={compact ? 18 : 20}
            strokeWidth={1.5}
            className={cn("text-black/70 transition-colors duration-200", ROW_HOVER_TEXT_CLASS)}
          />
        </div>
        <div className="text-right">
          <h3
            className={cn(
              "font-display font-bold text-black transition-colors duration-200",
              compact ? "text-m-body" : "text-lg",
              ROW_HOVER_TEXT_CLASS
            )}
          >
            {service.title}
          </h3>
          <p
            className={cn(
              "mt-1 whitespace-pre-line font-body text-[13px] text-black/55 transition-colors duration-200",
              compact ? "leading-[1.5]" : "leading-[1.6]",
              ROW_HOVER_TEXT_CLASS
            )}
          >
            {service.description}
          </p>
        </div>
      </div>

      <ArrowLeft
        aria-hidden
        size={compact ? 22 : 32}
        strokeWidth={compact ? 2 : 2.25}
        className="shrink-0 text-black transition-transform duration-200 group-hover:-translate-x-1"
      />
    </Link>
  );
}
