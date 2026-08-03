import { cn } from "@/lib/utils";

export default function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      {/* A flat arrow pointing left — "forward" in an RTL layout, matching
          the direction the service rows' own arrow already points. */}
      <path
        d="M11.5 7H2.5M6.5 3L2.5 7L6.5 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
