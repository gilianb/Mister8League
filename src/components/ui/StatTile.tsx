import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Chiffre clé : valeur en Fraunces, libellé en dessous, filet or au-dessus. */
export function StatTile({
  value,
  label,
  sub,
  accent = "gold",
  className,
}: {
  value: ReactNode;
  label: ReactNode;
  sub?: ReactNode;
  accent?: "gold" | "cream" | "brand";
  className?: string;
}) {
  const color = accent === "gold" ? "text-gold-400" : accent === "brand" ? "text-brand" : "text-cream-100";
  return (
    <div className={cn("border-t-2 border-gold-400/40 pt-3.5", className)}>
      <span className={cn("display-number block text-[2.125rem] sm:text-4xl", color)}>{value}</span>
      <span className="mt-2 block text-[13px] font-medium text-cream-400">{label}</span>
      {sub && <span className="mt-1 block text-xs leading-relaxed text-cream-600">{sub}</span>}
    </div>
  );
}
