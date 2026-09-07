"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

function remaining(targetIso: string) {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) {
    // passé depuis moins de 12 h : le tournoi se joue aujourd'hui
    return diff > -43_200_000 ? "today" : "over";
  }
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
  };
}

/** Compte à rebours avant le tournoi ; `tone="paper"` sur les billets. */
export default function Countdown({ targetIso, tone = "club" }: { targetIso: string; tone?: "club" | "paper" }) {
  const [time, setTime] = useState<ReturnType<typeof remaining> | undefined>(undefined);

  useEffect(() => {
    const tick = () => setTime(remaining(targetIso));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [targetIso]);

  const paper = tone === "paper";

  if (time === "today") {
    return <p className={cn("text-sm font-semibold", paper ? "text-poster" : "text-gold-400")}>C&apos;est aujourd&apos;hui. Bonne chance à tous !</p>;
  }
  if (time === "over") {
    return <p className={cn("text-sm font-medium", paper ? "text-ink-600" : "text-cream-500")}>Tournoi terminé. Les résultats arrivent.</p>;
  }

  const cells = [
    { value: time?.days, label: "jours" },
    { value: time?.hours, label: "heures" },
    { value: time?.minutes, label: "min" },
  ];

  return (
    <div className="flex gap-2.5" role="timer" aria-label="Compte à rebours avant le tournoi">
      {cells.map((c) => (
        <div
          key={c.label}
          className={cn(
            "min-w-[4.5rem] flex-1 rounded-control border py-2.5 text-center",
            paper ? "border-ink/12 bg-paper" : "hairline bg-coal-950"
          )}
        >
          <span className={cn("display-number block text-[1.75rem]", paper ? "text-ink" : "text-gold-400")}>
            {c.value === undefined ? "–" : String(c.value).padStart(2, "0")}
          </span>
          <span className={cn("mt-1 block text-[11px] font-medium", paper ? "text-ink-400" : "text-cream-600")}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}
