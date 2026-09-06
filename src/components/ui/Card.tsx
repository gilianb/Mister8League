import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = HTMLAttributes<HTMLDivElement> & {
  tone?: "club" | "paper" | "subtle";
  padding?: "none" | "sm" | "md" | "lg";
};

const PADDING = { none: "", sm: "p-4", md: "p-5 sm:p-6", lg: "p-6 sm:p-8" };

export function Card({ tone = "club", padding = "md", className, children, ...rest }: Props) {
  return (
    <div
      className={cn(
        tone === "paper"
          ? "bg-paper-50 text-ink poster-frame"
          : tone === "subtle"
            ? "rounded-xl border hairline bg-coal-900/60"
            : "rounded-2xl border hairline bg-coal-800",
        PADDING[padding],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
