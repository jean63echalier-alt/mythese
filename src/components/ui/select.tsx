import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-10 w-full appearance-none rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-burgundy)] focus-visible:border-transparent",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 12 12%22><path fill=%22none%22 stroke=%22%23767676%22 stroke-width=%221.5%22 d=%22M2.5 4.5l3.5 3.5 3.5-3.5%22/></svg>')] bg-no-repeat bg-[right_0.75rem_center] pr-9",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
