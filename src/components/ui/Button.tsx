import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "gold" | "brand" | "ghost" | "outline" | "danger" | "paper";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  /* Paille : action principale sur fond sombre */
  gold: "bg-gold-400 text-coal-950 hover:bg-gold-300 active:bg-gold-500",
  /* Ruban : engagement (payer, s'inscrire, confirmer) */
  brand: "bg-brand text-white hover:bg-brand-600 active:bg-brand-600",
  outline: "border border-cream-100/25 text-cream-100 hover:border-gold-400 hover:text-gold-300",
  ghost: "text-cream-300 hover:bg-cream-100/6 hover:text-cream-100",
  danger: "border border-brand/50 text-brand hover:bg-brand hover:text-white",
  /* Encre sur papier : boutons des billets et pages claires */
  paper: "bg-ink text-paper-50 hover:bg-coal-700",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-6 text-base",
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
    "inline-flex items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap select-none transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
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
