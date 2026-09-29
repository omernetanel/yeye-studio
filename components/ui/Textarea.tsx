import { type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * A multi-line field, on the same terms as Input: a label kept for screen
 * readers but hidden from view, and 16px type, below which iOS Safari zooms
 * the page in on focus and leaves it there.
 */
export default function Textarea({
  label,
  className,
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const fieldId = id ?? `field-${label.replace(/\s+/g, "-")}`;
  return (
    <span className="contents">
      <label htmlFor={fieldId} className="sr-only">
        {label}
      </label>
      <textarea
        id={fieldId}
        className={cn(
          "w-full resize-y rounded-[10px] border border-black/10 bg-black/[0.02] px-4 py-[14px] font-body text-m-body text-black outline-none transition-colors placeholder:text-black/45 focus:border-accent",
          className
        )}
        {...props}
      />
    </span>
  );
}
