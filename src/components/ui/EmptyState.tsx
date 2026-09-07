import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Un écran vide est une invitation à agir : titre, explication, action. */
export function EmptyState({
  title,
  text,
  action,
  className,
  compact = false,
}: {
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("rounded-panel border hairline text-center", compact ? "px-5 py-8" : "px-6 py-14", className)}>
      <p className={cn("font-display font-semibold tracking-tight text-cream-100", compact ? "text-xl" : "text-2xl")}>{title}</p>
      {text && <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-relaxed text-cream-400">{text}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
