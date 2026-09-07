import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconChevronLeft } from "./icons";

/** En-tête de page : lien de retour, libellé, grand titre, chapeau, actions. */
export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
  backHref,
  backLabel,
  size = "lg",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <div className={cn(size === "lg" ? "mb-12" : "mb-8", className)}>
      {backHref && (
        <Link href={backHref} className="mb-5 inline-flex items-center gap-1 text-sm text-cream-500 transition-colors hover:text-gold-300">
          <IconChevronLeft size={16} /> {backLabel ?? "Retour"}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div className="min-w-0 max-w-3xl">
          {eyebrow && <div className="kicker mb-3">{eyebrow}</div>}
          <h1
            className={cn(
              "font-display font-semibold tracking-[-0.025em] text-cream-100",
              size === "lg" ? "text-[2.5rem] leading-[1.02] sm:text-5xl lg:text-[3.75rem]" : "text-3xl leading-tight sm:text-4xl"
            )}
          >
            {title}
          </h1>
          {lede && (
            <p className={cn("max-w-[58ch] leading-relaxed text-cream-400", size === "lg" ? "mt-5 text-base sm:text-lg" : "mt-3 text-sm sm:text-base")}>
              {lede}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </div>
  );
}
