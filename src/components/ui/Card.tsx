import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = HTMLAttributes<HTMLDivElement> & {
  tone?: "club" | "paper" | "subtle";
  padding?: "none" | "sm" | "md" | "lg";
};

const PADDING = { none: "", sm: "p-4", md: "p-5 sm:p-6", lg: "p-6 sm:p-8" };

/** Panneau : `club` (sombre), `paper` (papier, pour les billets et documents), `subtle` (filet seul). */
export function Card({ tone = "club", padding = "md", className, children, ...rest }: Props) {
  return (
    <div
      className={cn(
        tone === "paper"
          ? "rounded-panel border border-ink/12 bg-paper-50 text-ink"
          : tone === "subtle"
            ? "rounded-panel border hairline"
            : "surface-panel",
        PADDING[padding],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
