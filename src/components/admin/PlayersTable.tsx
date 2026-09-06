"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { linkPlayerToProfileAction, mergePlayersAction, unlinkPlayerAction, updatePlayerAction } from "@/lib/admin/players";
import type { ActionState } from "@/lib/auth/actions";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import PlayerSearch from "./PlayerSearch";
import { cn } from "@/lib/cn";

export type AdminPlayerRow = {
  id: string;
  display_name: string;
  bandai_member_id: string | null;
  profile_id: string | null;
  pseudo: string | null;
  full_name: string | null;
  results_count: number;
  total_points: number;
};

export default function PlayersTable({ rows }: { rows: AdminPlayerRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "no_account" | "account">("all");
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [linking, setLinking] = useState<string | null>(null);
  const [merging, setMerging] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "no_account" && r.profile_id) return false;
      if (filter === "account" && !r.profile_id) return false;
      if (!s) return true;
      return `${r.display_name} ${r.pseudo ?? ""} ${r.full_name ?? ""} ${r.bandai_member_id ?? ""}`.toLowerCase().includes(s);
    });
  }, [rows, q, filter]);

  function run(fn: () => Promise<ActionState>) {
    setFeedback(null);
    start(async () => {
      const res = await fn();
      setFeedback(res.error ? { tone: "error", text: res.error } : { tone: "success", text: res.message ?? "OK" });
      if (!res.error) {
        setEditing(null);
        setLinking(null);
        setMerging(null);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un nom, pseudo, ID Bandai…" className="max-w-md" />
        <div className="flex gap-1 rounded-full bg-coal-900 p-1">
          {(
            [
              ["all", "Tous"],
              ["account", "Avec compte"],
              ["no_account", "Sans compte"],
            ] as const
          ).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter(key)} className={cn("rounded-full px-3 py-1 text-xs font-semibold", filter === key ? "bg-gold-400 text-coal-950" : "text-cream-400 hover:text-cream-100")}>
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-cream-600 ml-auto">{filtered.length} joueur(s)</span>
      </div>
      {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}

      <div className="rounded-2xl border hairline bg-coal-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] tracking-[0.16em] text-cream-600 text-left border-b hairline">
                <th className="px-3 py-3 font-semibold">JOUEUR</th>
                <th className="px-3 py-3 font-semibold">ID BANDAI</th>
                <th className="px-3 py-3 font-semibold">COMPTE</th>
                <th className="px-3 py-3 font-semibold text-right">TOURNOIS</th>
                <th className="px-3 py-3 font-semibold text-right">POINTS</th>
                <th className="px-3 py-3 font-semibold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y hairline">
              {filtered.map((r) => (
                <tr key={r.id} className={cn(pending && "opacity-70")}>
                  <td className="px-3 py-2.5">
                    {editing === r.id ? (
                      <form
                        className="flex flex-wrap gap-2"
                        action={(fd) => run(() => updatePlayerAction({}, fd))}
                      >
                        <input type="hidden" name="id" value={r.id} />
                        <Input name="display_name" defaultValue={r.display_name} className="w-44 py-1.5 text-xs" />
                        <Input name="bandai_member_id" defaultValue={r.bandai_member_id ?? ""} placeholder="ID Bandai" className="w-36 py-1.5 text-xs font-mono" />
                        <button type="submit" className="text-xs text-gold-400 hover:underline">
                          Enregistrer
                        </button>
                        <button type="button" onClick={() => setEditing(null)} className="text-xs text-cream-500 hover:underline">
                          Annuler
                        </button>
                      </form>
                    ) : (
                      <span className="font-medium text-cream-100">{r.display_name}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-cream-300">{r.bandai_member_id ?? <span className="text-cream-600">—</span>}</td>
                  <td className="px-3 py-2.5 text-xs">
                    {r.profile_id ? (
                      <span className="text-cream-300">
                        {r.pseudo ? (
                          <Link href={`/joueurs/${encodeURIComponent(r.pseudo)}`} className="text-gold-400 hover:underline">
                            {r.pseudo}
                          </Link>
                        ) : (
                          "compte"
                        )}
                        {r.full_name && <span className="block text-cream-600">{r.full_name}</span>}
                      </span>
                    ) : (
                      <Badge tone="warn">Sans compte</Badge>
                    )}
                    {linking === r.id && (
                      <form className="mt-2 flex gap-2" action={(fd) => run(() => linkPlayerToProfileAction(r.id, String(fd.get("pseudo") ?? "")))}>
                        <Input name="pseudo" placeholder="Pseudo du compte" className="w-40 py-1.5 text-xs" autoFocus />
                        <button type="submit" className="text-xs text-gold-400 hover:underline">
                          Rattacher
                        </button>
                      </form>
                    )}
                    {merging === r.id && (
                      <div className="mt-2 w-56">
                        <p className="text-[10px] text-cream-600 mb-1">Fusionner « {r.display_name} » dans :</p>
                        <PlayerSearch
                          onPick={(hit) => {
                            if (window.confirm(`Fusionner « ${r.display_name} » dans « ${hit.display_name} » ? Les résultats sont déplacés, l'identité source est archivée.`)) {
                              run(() => mergePlayersAction(r.id, hit.id));
                            }
                          }}
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular text-cream-300">{r.results_count}</td>
                  <td className="px-3 py-2.5 text-right tabular text-cream-100 font-semibold">{r.total_points}</td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap space-x-2 text-xs">
                    <button type="button" disabled={pending} onClick={() => setEditing(editing === r.id ? null : r.id)} className="text-cream-300 hover:underline">
                      Modifier
                    </button>
                    {r.profile_id ? (
                      <button type="button" disabled={pending} onClick={() => run(() => unlinkPlayerAction(r.id))} className="text-cream-500 hover:underline">
                        Détacher
                      </button>
                    ) : (
                      <button type="button" disabled={pending} onClick={() => setLinking(linking === r.id ? null : r.id)} className="text-gold-400 hover:underline">
                        Rattacher à un compte
                      </button>
                    )}
                    <button type="button" disabled={pending} onClick={() => setMerging(merging === r.id ? null : r.id)} className="text-amber-200 hover:underline">
                      Fusionner
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-cream-600">
                    Aucun joueur.
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
