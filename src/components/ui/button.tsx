import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-burgundy)] text-white hover:bg-[var(--color-burgundy-soft)] disabled:opacity-50 shadow-sm",
  secondary:
    "bg-[var(--color-cream)] text-[var(--color-ink)] hover:bg-[var(--color-line-soft)] border border-[var(--color-line)]",
  ghost:
    "bg-transparent text-[var(--color-ink-soft)] hover:bg-[var(--color-cream)]",
  outline:
    "bg-transparent border border-[var(--color-line)] text-[var(--color-ink)] hover:bg-[var(--color-cream)]",
  danger:
    "bg-red-700 text-white hover:bg-red-800",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-burgundy)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
        "disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
