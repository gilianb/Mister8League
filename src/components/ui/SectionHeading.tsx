import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  action,
  className,
  as: Tag = "h2",
  size = "md",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  action?: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
  size?: "sm" | "md" | "lg";
}) {
  const titleClass =
    size === "lg"
      ? "font-display text-3xl sm:text-4xl font-bold"
      : size === "sm"
        ? "text-[11px] tracking-[0.2em] font-semibold text-cream-600 uppercase"
        : "font-display text-xl sm:text-2xl font-bold";
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        {eyebrow && (
          <p className="text-[11px] tracking-[0.24em] text-gold-400 font-semibold mb-1.5 uppercase">{eyebrow}</p>
        )}
        <Tag className={cn(titleClass, size !== "sm" && "text-cream-100")}>{title}</Tag>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
