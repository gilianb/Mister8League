"use client";

import { useEffect, useState } from "react";
import { searchPlayersAction, type PlayerSearchHit } from "@/lib/admin/results";
import { Input } from "@/components/ui/Field";

/** Recherche d'un joueur (nom, pseudo, ID Bandai) avec rappel de l'identifiant choisi. */
export default function PlayerSearch({ onPick, placeholder = "Nom ou ID Bandai…" }: { onPick: (hit: PlayerSearchHit) => void; placeholder?: string }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<PlayerSearchHit[]>([]);

  useEffect(() => {
    if (q.trim().length < 2) return;
    let cancelled = false;
    const id = setTimeout(async () => {
      const res = await searchPlayersAction(q);
      if (!cancelled) setHits(res);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [q]);

  return (
    <div className="relative">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="text-xs py-1.5" />
      {q.trim().length >= 2 && hits.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border hairline bg-coal-900 shadow-lg text-xs">
          {hits.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(h);
                  setQ("");
                  setHits([]);
                }}
                className="w-full text-left px-3 py-2 hover:bg-coal-700/60 text-cream-100"
              >
                {h.display_name}
                {h.pseudo && h.pseudo !== h.display_name ? ` (${h.pseudo})` : ""}
                <span className="block text-cream-600 font-mono">{h.bandai_member_id ?? "sans ID Bandai"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
