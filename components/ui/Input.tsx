import { type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * A field, with its label attached.
 *
 * The label is carried here rather than left to each form because a field
 * identified only by its placeholder has no name at all for a screen reader,
 * and the placeholder disappears the moment someone starts typing. It is
 * hidden visually — the forms are designed without visible labels and that
 * does not change — but it is in the accessibility tree, and clicking it
 * focuses the field.
 */
export default function Input({
  label,
  className,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const fieldId = id ?? `field-${label.replace(/\s+/g, "-")}`;
  return (
    <span className="contents">
      <label htmlFor={fieldId} className="sr-only">
        {label}
      </label>
      <InputControl id={fieldId} className={className} {...props} />
    </span>
  );
}

function InputControl({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        // 16px, and not one pixel less. Below sixteen, iOS Safari zooms the
        // whole page in when a field takes focus and does not zoom back out —
        // so a form built at 15px leaves the reader stranded on a page that is
        // suddenly too wide, mid-enquiry. It is also the body size in the
        // phone's scale, which is what it should have been anyway.
        "w-full rounded-[10px] border border-black/10 bg-black/[0.02] px-4 py-[14px] font-body text-m-body text-black outline-none transition-colors placeholder:text-black/45 focus:border-accent",
        className
      )}
      {...props}
    />
  );
}
