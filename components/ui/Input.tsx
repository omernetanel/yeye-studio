import { type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        // 16px, and not one pixel less. Below sixteen, iOS Safari zooms the
        // whole page in when a field takes focus and does not zoom back out —
        // so a form built at 15px leaves the reader stranded on a page that is
        // suddenly too wide, mid-enquiry. It is also the body size in the
        // phone's scale, which is what it should have been anyway.
        "w-full rounded-[10px] border border-black/10 bg-black/[0.02] px-4 py-[14px] font-body text-m-body text-black outline-none transition-colors placeholder:text-black/30 focus:border-accent",
        className
      )}
      {...props}
    />
  );
}
