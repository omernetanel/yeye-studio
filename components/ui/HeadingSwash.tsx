import { cn } from "@/lib/utils";

/**
 * The hand-drawn underline that goes beneath a heading — a single brush stroke
 * that thickens through the middle and tapers at both ends, rather than a rule.
 * Drawn as a filled outline rather than a stroked line precisely so the weight
 * can vary along it, which is what makes it read as drawn instead of ruled.
 *
 * Takes its colour from the text around it, so the same mark works on the white
 * paper and on the black section without a variant.
 */
export default function HeadingSwash({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 16"
      fill="none"
      aria-hidden="true"
      className={cn("block h-auto", className)}
      preserveAspectRatio="none"
    >
      <path
        d="M3.5 9.2c34-3.6 68-5.4 102-5.6 34-.2 68 1.2 131.5 4.4-63.4 1.2-97.4 2.9-131.4 4-34 1.1-68 1.8-102 1.6z"
        fill="currentColor"
      />
    </svg>
  );
}
