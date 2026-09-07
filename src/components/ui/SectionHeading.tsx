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
      ? "font-display text-3xl font-semibold tracking-[-0.02em] text-cream-100 sm:text-4xl"
      : size === "sm"
        ? "text-[15px] font-semibold text-cream-100"
        : "font-display text-2xl font-medium tracking-[-0.015em] text-cream-100 sm:text-[1.75rem]";
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="kicker mb-2">{eyebrow}</div>}
        <Tag className={titleClass}>{title}</Tag>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
