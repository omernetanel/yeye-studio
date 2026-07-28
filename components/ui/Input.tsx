import { type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[10px] border border-black/10 bg-black/[0.02] px-4 py-[14px] font-body text-[15px] text-black outline-none transition-colors placeholder:text-black/30 focus:border-accent",
        className
      )}
      {...props}
    />
  );
}
