import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconCheck, IconInfo, IconWarning, IconX } from "./icons";

export type AlertTone = "info" | "success" | "warn" | "error";

const TONES: Record<AlertTone, { box: string; icon: string; Icon: typeof IconInfo }> = {
  info: { box: "border-gold-400 bg-gold-400/8 text-cream-100", icon: "text-gold-400", Icon: IconInfo },
  success: { box: "border-emerald-400 bg-emerald-400/8 text-emerald-50", icon: "text-emerald-300", Icon: IconCheck },
  warn: { box: "border-amber-400 bg-amber-400/8 text-amber-50", icon: "text-amber-300", Icon: IconWarning },
  error: { box: "border-brand bg-brand/10 text-red-50", icon: "text-red-300", Icon: IconX },
};

/** Bandeau d'information à bordure gauche colorée. */
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
  const { box, icon, Icon } = TONES[tone];
  return (
    <div
      className={cn("flex gap-3 rounded-control border-l-4 px-4 py-3 text-sm leading-relaxed", box, className)}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon size={18} className={cn("mt-0.5 shrink-0", icon)} />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title ? "mt-0.5" : undefined, "opacity-90")}>{children}</div>}
      </div>
    </div>
  );
}
