import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

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
    <div className={cn("rounded-xl bg-coal-800 border hairline px-4 py-3.5", className)}>
      <span className={cn("block text-2xl font-bold tabular leading-tight", color)}>{value}</span>
      <span className="block text-[9px] tracking-[0.14em] text-cream-600 font-semibold mt-1 uppercase">{label}</span>
      {sub && <span className="block text-xs text-cream-400 mt-1">{sub}</span>}
    </div>
  );
}
