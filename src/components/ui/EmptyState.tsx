import type { ReactNode } from "react";
import HatLogo from "@/components/HatLogo";
import { cn } from "@/lib/cn";

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
    <div
      className={cn(
        "rounded-2xl border border-dashed border-gold-400/25 bg-coal-800/60 text-center",
        compact ? "px-4 py-6" : "px-6 py-10",
        className
      )}
    >
      {!compact && <HatLogo className="w-12 mx-auto mb-4 opacity-80" />}
      <p className="font-display text-lg font-bold text-cream-100">{title}</p>
      {text && <p className="mt-1.5 text-sm text-cream-400 max-w-[48ch] mx-auto">{text}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
