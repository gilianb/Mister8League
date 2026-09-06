import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "gold" | "brand" | "ghost" | "outline" | "danger" | "paper";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  gold: "bg-gold-400 text-coal-950 hover:bg-gold-300 shadow-[0_1px_0_rgba(0,0,0,.25)]",
  brand: "bg-brand text-white hover:brightness-110",
  ghost: "text-cream-200 hover:bg-coal-700/60",
  outline: "border border-gold-400/60 text-gold-400 hover:bg-gold-400 hover:text-coal-950",
  danger: "border border-brand/50 text-brand hover:bg-brand hover:text-white",
  paper:
    "bg-ink text-gold-400 font-poster tracking-wider shadow-[4px_4px_0_#c9331f] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#c9331f]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  pending?: boolean;
  type?: "button" | "submit" | "reset";
  children: ReactNode;
  external?: boolean;
};

export function Button({
  variant = "gold",
  size = "md",
  href,
  pending = false,
  className,
  children,
  disabled,
  type = "button",
  external,
  ...rest
}: Props) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 whitespace-nowrap",
    VARIANTS[variant],
    SIZES[size],
    className
  );

  if (href) {
    if (external) {
      return (
        <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled || pending} {...rest}>
      {pending && <Spinner size={14} />}
      {children}
    </button>
  );
}
