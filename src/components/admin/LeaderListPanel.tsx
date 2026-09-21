"use client";

import { useState } from "react";
import { setRowLeadersBulkAction } from "@/lib/admin/results";
import { matchLeaderList, type MatchResult } from "@/lib/league/leader-list";
import type { ImportRowView } from "@/lib/league/import";
import type { LeaderOption } from "@/lib/db/leaders";
import type { ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const PLACEHOLDER = `Nicolo : Enel OP15
Kem : Mihawk OP14
Flint : ST30 Ace et Luffy
…`;

const ISSUE_LABEL: Record<MatchResult["issues"][number]["kind"], string> = {
  player_not_found: "Joueur introuvable dans le CSV",
  player_ambiguous: "Plusieurs joueurs possibles",
  leader_unknown: "Leader absent du catalogue",
  leader_ambiguous: "Set à préciser",
  leader_missing: "Ligne illisible",
};

export default function LeaderListPanel({
  importId,
  rows,
  leaders,
  pending,
  run,
}: {
  importId: string;
  rows: ImportRowView[];
  leaders: LeaderOption[];
  pending: boolean;
  run: (fn: () => Promise<ActionState>, successText?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [preview, setPreview] = useState<MatchResult | null>(null);

  function analyse() {
    const res = matchLeaderList(
      text,
      rows.map((r) => ({ id: r.id, playerName: r.player_name, leaderId: r.leader_id, resolution: r.resolution })),
      leaders.map((l) => ({ id: l.id, code: l.code, name: l.name })),
      { overwrite }
    );
    setPreview(res);
  }

  function apply() {
    if (!preview || preview.assignments.length === 0) return;
    const items = preview.assignments.map((a) => ({ rowId: a.rowId, leaderId: a.leaderId }));
    run(() => setRowLeadersBulkAction(importId, items));
    setPreview(null);
  }

  if (!open) {
    return (
      <div>
        <button type="button" onClick={() => setOpen(true)} className="text-sm text-gold-400 underline-offset-4 hover:underline">
          Attribuer les leaders depuis une liste collée
        </button>
      </div>
    );
  }

  const fuzzy = preview?.assignments.filter((a) => a.confidence === "fuzzy") ?? [];

  return (
    <Card tone="subtle" padding="sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-cream-100">Attribuer les leaders depuis une liste</p>
          <p className="mt-1 text-xs text-cream-500">
            Une ligne par joueur, au format <span className="font-mono text-cream-300">Pseudo : Leader Set</span>. Les pseudos approximatifs et les
            surnoms de leaders (Ener, Mohawk, Teach…) sont reconnus. Rien n&apos;est enregistré avant « Appliquer ».
          </p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-cream-500 hover:text-cream-100 hover:underline">
          Fermer
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setPreview(null);
        }}
        placeholder={PLACEHOLDER}
        rows={8}
        spellCheck={false}
        className="mt-3 w-full rounded-control border border-coal-700 bg-coal-950 px-3 py-2 font-mono text-xs leading-5 text-cream-100 placeholder:text-cream-600"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-cream-400">
          <input type="checkbox" checked={overwrite} onChange={(e) => { setOverwrite(e.target.checked); setPreview(null); }} className="accent-gold-400" />
          Remplacer les leaders déjà choisis
        </label>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" disabled={pending || !text.trim()} onClick={analyse}>
            Analyser la liste
          </Button>
          <Button size="sm" variant="brand" pending={pending} disabled={!preview || preview.assignments.length === 0} onClick={apply}>
            Appliquer {preview && preview.assignments.length > 0 ? `${preview.assignments.length} attribution${preview.assignments.length > 1 ? "s" : ""}` : ""}
          </Button>
        </div>
      </div>

      {preview && (
        <div className="mt-4 space-y-3 text-xs">
          <p className="text-cream-300">
            <b className="text-emerald-300">{preview.assignments.length}</b> attribution{preview.assignments.length > 1 ? "s" : ""} prête
            {preview.assignments.length > 1 ? "s" : ""}
            {fuzzy.length > 0 && <> (dont <b className="text-amber-200">{fuzzy.length}</b> par ressemblance de pseudo)</>}
            {preview.keptExisting > 0 && <> · {preview.keptExisting} déjà renseignée{preview.keptExisting > 1 ? "s" : ""}, conservée{preview.keptExisting > 1 ? "s" : ""}</>}
            {preview.issues.length > 0 && <> · <b className="text-red-300">{preview.issues.length}</b> à vérifier</>}
          </p>

          {fuzzy.length > 0 && (
            <div>
              <p className="mb-1 font-semibold text-amber-200">Rapprochements par ressemblance, à vérifier d&apos;un coup d&apos;œil</p>
              <ul className="space-y-0.5 text-cream-300">
                {fuzzy.map((a) => (
                  <li key={a.rowId}>
                    « {a.entryName} » → <span className="text-cream-100">{a.rowName}</span> · {a.leaderLabel}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.issues.length > 0 && (
            <div>
              <p className="mb-1 font-semibold text-red-300">Non attribués (à faire à la main, ou après complément du catalogue)</p>
              <ul className="space-y-1">
                {preview.issues.map((i) => (
                  <li key={`${i.line}-${i.raw}`} className="flex flex-wrap items-baseline gap-2">
                    <Badge tone="neutral">{ISSUE_LABEL[i.kind]}</Badge>
                    <span className="text-cream-300">
                      ligne {i.line} · {i.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
