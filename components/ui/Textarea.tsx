import { type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full resize-y rounded-[10px] border border-white/10 bg-surface px-4 py-[14px] font-body text-[15px] text-white outline-none transition-colors placeholder:text-white/30 focus:border-primary",
        className
      )}
      {...props}
    />
  );
}
