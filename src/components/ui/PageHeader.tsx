import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconChevronLeft } from "./icons";

export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
  backHref,
  backLabel,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-8", className)}>
      {backHref && (
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-cream-600 hover:text-gold-400 mb-4">
          <IconChevronLeft size={16} /> {backLabel ?? "Retour"}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] tracking-[0.24em] text-gold-400 font-semibold mb-2 uppercase">{eyebrow}</p>
          )}
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream-100 text-balance">{title}</h1>
          {lede && <p className="mt-3 text-cream-400 max-w-[60ch]">{lede}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
