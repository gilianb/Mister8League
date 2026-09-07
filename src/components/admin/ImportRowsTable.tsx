"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyImportAction, discardImportAction, resolveRowAction, setRowLeaderAction } from "@/lib/admin/results";
import type { ImportRowView, NoShowView } from "@/lib/league/import";
import type { LeaderOption } from "@/lib/db/leaders";
import type { ActionState } from "@/lib/auth/actions";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import PlayerSearch from "./PlayerSearch";
import { cn } from "@/lib/cn";

const RES_LABEL: Record<string, { label: string; tone: BadgeTone }> = {
  auto_player: { label: "Joueur connu", tone: "good" },
  auto_registration: { label: "Inscrit reconnu", tone: "good" },
  registration: { label: "Lié à un inscrit", tone: "gold" },
  player: { label: "Lié à un joueur", tone: "gold" },
  new_player: { label: "Nouveau joueur", tone: "info" },
  skip: { label: "Ignoré", tone: "neutral" },
  unresolved: { label: "À résoudre", tone: "bad" },
};

export default function ImportRowsTable({
  importId,
  rows,
  noShows,
  leaders,
}: {
  importId: string;
  rows: ImportRowView[];
  noShows: NoShowView[];
  leaders: LeaderOption[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [onlyUnresolved, setOnlyUnresolved] = useState(false);

  const unresolved = rows.filter((r) => r.resolution === "unresolved").length;
  const withoutLeader = rows.filter((r) => r.resolution !== "skip" && !r.leader_id).length;
  const visible = useMemo(() => (onlyUnresolved ? rows.filter((r) => r.resolution === "unresolved") : rows), [rows, onlyUnresolved]);

  function run(fn: () => Promise<ActionState>, successText?: string) {
    setFeedback(null);
    start(async () => {
      const res = await fn();
      if (res.error) setFeedback({ tone: "error", text: res.error });
      else if (successText || res.message) setFeedback({ tone: "success", text: res.message ?? successText ?? "OK" });
      router.refresh();
    });
  }

  function publish() {
    const msg = unresolved > 0
      ? `${unresolved} ligne(s) non résolue(s) seront créées comme nouveaux joueurs (sans compte). Publier quand même ?`
      : "Publier les résultats ? Le classement de la ligue sera mis à jour et le tournoi passera en « terminé ».";
    if (!window.confirm(msg)) return;
    run(() => applyImportAction(importId));
  }

  function resolvedLabel(r: ImportRowView) {
    if (r.player) return `${r.player.profile?.pseudo ?? r.player.display_name}${r.player.bandai_member_id ? ` · ${r.player.bandai_member_id}` : ""}`;
    if (r.registration) return `${r.registration.profile?.pseudo ?? r.registration.participant_name} (inscrit)`;
    if (r.resolution === "new_player" || r.resolution === "unresolved") return "Créera un joueur sans compte";
    return "";
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-cream-300">
          <b className="text-cream-100">{rows.length}</b> lignes ·{" "}
          <b className={unresolved ? "text-red-300" : "text-emerald-300"}>{unresolved}</b> à résoudre ·{" "}
          <b className="text-cream-100">{withoutLeader}</b> sans leader
        </span>
        <label className="text-xs text-cream-400 inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={onlyUnresolved} onChange={(e) => setOnlyUnresolved(e.target.checked)} className="accent-gold-400" />
          N&apos;afficher que les lignes à résoudre
        </label>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" pending={pending} onClick={() => run(() => discardImportAction(importId))}>
            Abandonner l&apos;import
          </Button>
          <Button size="sm" variant="brand" pending={pending} onClick={publish}>
            Publier les résultats
          </Button>
        </div>
      </div>
      {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}

      {noShows.length > 0 && (
        <Card tone="subtle" padding="sm">
          <p className="mb-1 text-sm font-semibold text-amber-200">Inscrits absents du CSV ({noShows.length})</p>
          <p className="text-xs text-cream-600 mb-2">Non-présents, ou joueurs dont le numéro Bandai du profil ne correspond pas. Liez-les à une ligne « à résoudre » si besoin.</p>
          <p className="text-xs text-cream-300">{noShows.map((n) => `${n.pseudo ?? n.participant_name}${n.bandai_member_id ? ` (${n.bandai_member_id})` : " (sans ID)"}`).join(" · ")}</p>
        </Card>
      )}

      <div className="surface-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head border-b hairline text-left">
                <th className="px-3 py-3 font-semibold">#</th>
                <th className="px-3 py-3 font-semibold">CSV Bandai</th>
                <th className="px-3 py-3 font-semibold">Bilan</th>
                <th className="px-3 py-3 font-semibold">Rapprochement</th>
                <th className="px-3 py-3 font-semibold">Leader</th>
                <th className="px-3 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {visible.map((r) => {
                const res = RES_LABEL[r.resolution] ?? RES_LABEL.unresolved;
                return (
                  <tr key={r.id} className={cn(r.resolution === "unresolved" && "bg-brand/5", r.resolution === "skip" && "opacity-50")}>
                    <td className="px-3 py-2 font-semibold tabular text-cream-100">{r.placement}</td>
                    <td className="px-3 py-2">
                      <span className="text-cream-100">{r.player_name}</span>
                      <span className="block font-mono text-xs text-cream-600">{r.bandai_member_id ?? "sans ID"}</span>
                    </td>
                    <td className="px-3 py-2 tabular text-cream-300 whitespace-nowrap">
                      {r.wins}-{r.losses}
                      {r.draws ? `-${r.draws}` : ""} <span className="text-cream-600">({r.match_points} pts)</span>
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={res.tone}>{res.label}</Badge>
                      <span className="block text-xs text-cream-400 mt-1">{resolvedLabel(r)}</span>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={r.leader_id ?? ""}
                        disabled={pending || r.resolution === "skip"}
                        onChange={(e) => run(() => setRowLeaderAction(r.id, e.target.value || null))}
                        className="w-44 rounded-control border border-coal-700 bg-coal-950 px-2 py-1.5 text-xs text-cream-100"
                      >
                        <option value="">— Leader inconnu —</option>
                        {leaders.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} {l.code ? `(${l.code})` : ""}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <RowActions row={r} noShows={noShows} pending={pending} run={run} />
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-cream-600">
                    Rien à afficher.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RowActions({
  row,
  noShows,
  pending,
  run,
}: {
  row: ImportRowView;
  noShows: NoShowView[];
  pending: boolean;
  run: (fn: () => Promise<ActionState>, successText?: string) => void;
}) {
  const [mode, setMode] = useState<"none" | "registration" | "player">("none");

  if (row.resolution === "auto_player" || row.resolution === "auto_registration") {
    return (
      <button type="button" disabled={pending} onClick={() => run(() => resolveRowAction(row.id, { kind: "unresolved" }))} className="text-xs text-cream-500 hover:text-cream-100 hover:underline">
        Défaire
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1 min-w-52">
      {mode === "registration" && (
        <select
          autoFocus
          defaultValue=""
          disabled={pending}
          onChange={(e) => {
            if (e.target.value) run(() => resolveRowAction(row.id, { kind: "registration", registrationId: e.target.value }), "Ligne liée à l'inscrit.");
            setMode("none");
          }}
          className="w-full rounded-control border border-coal-700 bg-coal-950 px-2 py-1.5 text-xs text-cream-100"
        >
          <option value="">Choisir un inscrit…</option>
          {noShows.map((n) => (
            <option key={n.id} value={n.id}>
              {n.pseudo ?? n.participant_name} {n.bandai_member_id ? `(${n.bandai_member_id})` : "(sans ID)"}
            </option>
          ))}
        </select>
      )}
      {mode === "player" && (
        <div className="w-full">
          <PlayerSearch
            onPick={(hit) => {
              run(() => resolveRowAction(row.id, { kind: "player", playerId: hit.id }), "Ligne liée au joueur.");
              setMode("none");
            }}
          />
        </div>
      )}
      <div className="flex flex-wrap justify-end gap-x-2 gap-y-1 text-xs">
        {noShows.length > 0 && (
          <button type="button" disabled={pending} onClick={() => setMode(mode === "registration" ? "none" : "registration")} className="text-gold-400 underline-offset-4 hover:underline">
            Lier à un inscrit
          </button>
        )}
        <button type="button" disabled={pending} onClick={() => setMode(mode === "player" ? "none" : "player")} className="text-gold-400 underline-offset-4 hover:underline">
          Lier à un joueur
        </button>
        {row.resolution !== "new_player" && (
          <button type="button" disabled={pending} onClick={() => run(() => resolveRowAction(row.id, { kind: "new_player" }))} className="text-rift-300 hover:underline">
            Nouveau joueur
          </button>
        )}
        {row.resolution !== "skip" ? (
          <button type="button" disabled={pending} onClick={() => run(() => resolveRowAction(row.id, { kind: "skip" }))} className="text-cream-500 hover:underline">
            Ignorer
          </button>
        ) : (
          <button type="button" disabled={pending} onClick={() => run(() => resolveRowAction(row.id, { kind: "unresolved" }))} className="text-cream-500 hover:underline">
            Rétablir
          </button>
        )}
      </div>
    </div>
  );
}
