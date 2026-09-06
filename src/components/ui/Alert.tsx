import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconCheck, IconInfo, IconWarning, IconX } from "./icons";

export type AlertTone = "info" | "success" | "warn" | "error";

const TONES: Record<AlertTone, { box: string; Icon: typeof IconInfo }> = {
  info: { box: "border-gold-400/30 bg-gold-400/10 text-gold-200", Icon: IconInfo },
  success: { box: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200", Icon: IconCheck },
  warn: { box: "border-amber-400/30 bg-amber-400/10 text-amber-100", Icon: IconWarning },
  error: { box: "border-brand/40 bg-brand/10 text-red-200", Icon: IconX },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const { box, Icon } = TONES[tone];
  return (
    <div className={cn("flex gap-3 rounded-xl border px-4 py-3 text-sm", box, className)} role={tone === "error" ? "alert" : "status"}>
      <Icon size={18} className="shrink-0 mt-0.5" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title ? "mt-0.5" : undefined, "opacity-90")}>{children}</div>}
      </div>
    </div>
  );
}
