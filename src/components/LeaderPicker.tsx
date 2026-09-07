"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import type { LeaderOption } from "@/lib/db/leaders";
import { Input } from "./ui/Field";
import { cn } from "@/lib/cn";
import { IconX } from "./ui/icons";

const COLOR_DOT: Record<string, string> = {
  Rouge: "#d63a2a",
  Vert: "#3f9a55",
  Bleu: "#3a74c4",
  Violet: "#7d4fb0",
  Noir: "#2a2a2a",
  Jaune: "#e5c23a",
};

/**
 * Sélecteur de leader avec recherche et vignettes. Champ de formulaire :
 * un <input type="hidden" name={name}> porte l'identifiant choisi.
 */
export default function LeaderPicker({
  leaders,
  name = "leader_id",
  defaultValue = null,
  value,
  onChange,
  label = "Leader",
  allowEmpty = true,
}: {
  leaders: LeaderOption[];
  name?: string;
  defaultValue?: string | null;
  value?: string | null;
  onChange?: (id: string | null) => void;
  label?: string;
  allowEmpty?: boolean;
}) {
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const selectedId = value !== undefined ? value : internal;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => leaders.find((l) => l.id === selectedId) ?? null, [leaders, selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? leaders.filter((l) => `${l.name} ${l.code ?? ""} ${l.colors.join(" ")}`.toLowerCase().includes(q))
      : leaders;
    return list.slice(0, 60);
  }, [leaders, query]);

  function choose(id: string | null) {
    if (value === undefined) setInternal(id);
    onChange?.(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={selectedId ?? ""} />
      <span className="block text-[13px] font-medium text-cream-300">{label}</span>
      {selected ? (
        <div className="flex items-center gap-3 rounded-control border border-coal-700 bg-coal-950 px-3 py-2">
          {selected.imageUrl && (
            <img src={selected.imageUrl} alt="" className="size-12 rounded-control border border-black/30 object-cover" style={{ objectPosition: "50% 18%" }} />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-cream-100 truncate">{selected.name}</p>
            <p className="text-xs text-cream-500">
              {selected.code}
              {selected.colors.length > 0 && `, ${selected.colors.join(" / ")}`}
            </p>
          </div>
          <button type="button" onClick={() => setOpen(true)} className="text-xs text-gold-400 hover:underline">
            Changer
          </button>
          {allowEmpty && (
            <button type="button" onClick={() => choose(null)} className="text-cream-600 hover:text-cream-100" aria-label="Retirer le leader">
              <IconX size={16} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-11 w-full rounded-control border border-dashed border-coal-600 bg-coal-950 px-3.5 text-left text-sm text-cream-500 transition-colors hover:border-gold-400/60 hover:text-cream-200"
        >
          Choisir un leader (facultatif)…
        </button>
      )}

      {open && (
        <div className="space-y-3 rounded-panel border hairline bg-coal-800 p-3">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher : Luffy, OP09, Rouge…"
            aria-label="Rechercher un leader"
          />
          <ul className="max-h-72 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filtered.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => choose(l.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-control border px-2 py-1.5 text-left transition-colors hover:border-gold-400/60",
                    l.id === selectedId ? "border-gold-400 bg-gold-400/10" : "border-coal-700 bg-coal-950"
                  )}
                >
                  {l.imageUrl ? (
                    <img src={l.imageUrl} alt="" className="size-10 shrink-0 rounded-control border border-black/30 object-cover" style={{ objectPosition: "50% 18%" }} loading="lazy" />
                  ) : (
                    <span className="size-10 shrink-0 rounded-control bg-coal-700" />
                  )}
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-cream-100 truncate">{l.name}</span>
                    <span className="flex items-center gap-1 text-[10px] text-cream-600">
                      {l.code}
                      {l.colors.map((c) => (
                        <span key={c} className="inline-block h-2 w-2 rounded-full border border-black/30" style={{ background: COLOR_DOT[c] ?? "#888" }} title={c} />
                      ))}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="col-span-full text-sm text-cream-600 px-1 py-2">Aucun leader trouvé.</li>}
          </ul>
          <div className="flex justify-end">
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-cream-400 hover:text-cream-100">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
