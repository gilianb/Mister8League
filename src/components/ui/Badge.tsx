import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "gold" | "good" | "warn" | "bad" | "info";

const TONES: Record<BadgeTone, string> = {
  neutral: "border-cream-100/15 text-cream-400",
  gold: "border-gold-400/40 bg-gold-400/10 text-gold-300",
  good: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  warn: "border-amber-400/35 bg-amber-400/10 text-amber-200",
  bad: "border-brand/40 bg-brand/10 text-red-300",
  info: "border-rift-400/40 bg-rift-400/10 text-rift-300",
};

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-5",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
