"use client";

import { useEffect, useState } from "react";

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

export default function Countdown({
  targetIso,
  accent = "gold",
}: {
  targetIso: string;
  accent?: "gold" | "rift";
}) {
  const [time, setTime] = useState<ReturnType<typeof remaining> | undefined>(
    undefined
  );

  useEffect(() => {
    setTime(remaining(targetIso));
    const id = setInterval(() => setTime(remaining(targetIso)), 30_000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (time === "today") {
    return (
      <p className="text-sm font-semibold text-gold-400 tracking-wide">
        C&apos;est aujourd&apos;hui — bonne chance à tous !
      </p>
    );
  }
  if (time === "over") {
    return (
      <p className="text-sm font-semibold text-cream-600 tracking-wide">
        Tournoi terminé — résultats bientôt en ligne.
      </p>
    );
  }

  const cells = [
    { value: time?.days, label: "JOURS" },
    { value: time?.hours, label: "HEURES" },
    { value: time?.minutes, label: "MIN" },
  ];

  return (
    <div className="flex gap-2.5" role="timer" aria-label="Compte à rebours avant le tournoi">
      {cells.map((c) => (
        <div
          key={c.label}
          className={`flex-1 min-w-16 rounded-lg border bg-coal-900 py-2.5 text-center ${
            accent === "rift" ? "border-rift-400/20" : "hairline"
          }`}
        >
          <span
            className={`block text-2xl font-bold tabular ${
              accent === "rift" ? "text-rift-300" : "text-gold-400"
            }`}
          >
            {c.value === undefined ? "–" : String(c.value).padStart(2, "0")}
          </span>
          <span className="text-[9px] tracking-[0.18em] text-cream-600 font-semibold">
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}
