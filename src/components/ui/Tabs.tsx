import Link from "next/link";
import { cn } from "@/lib/cn";

export type TabItem = { href: string; label: string; active: boolean; count?: number };

/** Onglets de navigation soulignés : filet or sous l'onglet actif. */
export function Tabs({ items, className }: { items: TabItem[]; className?: string }) {
  return (
    <div className={cn("flex gap-6 overflow-x-auto border-b hairline", className)}>
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={cn(
            "-mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors",
            t.active ? "border-gold-400 text-cream-100" : "border-transparent text-cream-500 hover:text-cream-100"
          )}
          aria-current={t.active ? "page" : undefined}
        >
          {t.label}
          {typeof t.count === "number" && (
            <span className={cn("tabular rounded-full px-1.5 py-0.5 text-[11px]", t.active ? "bg-gold-400/15 text-gold-300" : "bg-coal-700 text-cream-400")}>
              {t.count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
