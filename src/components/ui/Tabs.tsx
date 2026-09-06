import Link from "next/link";
import { cn } from "@/lib/cn";

export type TabItem = { href: string; label: string; active: boolean; count?: number };

/** Onglets de navigation (liens), style pilule « Le Club ». */
export function Tabs({ items, className }: { items: TabItem[]; className?: string }) {
  return (
    <div className={cn("inline-flex flex-wrap rounded-full border hairline overflow-hidden bg-coal-800", className)}>
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={cn(
            "px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap inline-flex items-center gap-2",
            t.active ? "bg-gold-400 text-coal-950" : "text-cream-400 hover:text-cream-100"
          )}
          aria-current={t.active ? "page" : undefined}
        >
          {t.label}
          {typeof t.count === "number" && (
            <span className={cn("text-[10px] rounded-full px-1.5 py-0.5 tabular", t.active ? "bg-coal-950/15" : "bg-coal-700")}>
              {t.count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
