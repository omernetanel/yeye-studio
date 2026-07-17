import { type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[10px] border border-white/10 bg-surface px-4 py-[14px] font-body text-[15px] text-white outline-none transition-colors placeholder:text-white/30 focus:border-primary",
        className
      )}
      {...props}
    />
  );
}
