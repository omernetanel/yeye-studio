import { type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-2 block font-display text-sm text-white/60", className)} {...props} />;
}
