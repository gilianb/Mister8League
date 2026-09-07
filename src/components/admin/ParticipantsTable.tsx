"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelRegistrationAction, deleteRegistrationAction, markPaidManuallyAction, resendTicketAction } from "@/lib/admin/registrations";
import { checkInRegistrationAction, undoCheckInAction } from "@/lib/tournaments/checkin";
import type { ActionState } from "@/lib/auth/actions";
import { registrationCode } from "@/lib/tournaments/codes";
import { registrationStatusLabel } from "@/lib/tournaments/status";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/cn";

export type ParticipantRow = {
  id: string;
  status: string;
  participant_name: string;
  participant_email: string;
  participant_phone: string | null;
  notes: string | null;
  payment_provider: string | null;
  amount_cents: number | null;
  created_at: string;
  checked_in_at: string | null;
  expires_at: string | null;
  pseudo: string | null;
  bandai_member_id: string | null;
  leader_name: string | null;
  invoice_url: string | null;
};

const TONES: Record<string, BadgeTone> = { paid: "good", checked_in: "gold", pending_payment: "warn", cancelled: "neutral", refunded: "neutral" };
const PROVIDER: Record<string, string> = { mollie: "Mollie", cash: "Boutique", free: "Gratuit" };

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(iso));
}

export default function ParticipantsTable({ rows, nowMs }: { rows: ParticipantRow[]; nowMs: number }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "checked_in" | "pending" | "cancelled">("active");
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "active" && !["paid", "checked_in", "pending_payment"].includes(r.status)) return false;
      if (filter === "checked_in" && r.status !== "checked_in") return false;
      if (filter === "pending" && r.status !== "pending_payment") return false;
      if (filter === "cancelled" && !["cancelled", "refunded"].includes(r.status)) return false;
      if (!s) return true;
      return `${r.participant_name} ${r.participant_email} ${r.pseudo ?? ""} ${r.bandai_member_id ?? ""} ${registrationCode(r.id)} ${r.leader_name ?? ""}`.toLowerCase().includes(s);
    });
  }, [rows, q, filter]);

  function run(label: string, fn: () => Promise<ActionState>) {
    setFeedback(null);
    start(async () => {
      const res = await fn();
      setFeedback(res.error ? { tone: "error", text: res.error } : { tone: "success", text: res.message ?? `${label} : OK` });
      router.refresh();
    });
  }

  const FILTERS: Array<[typeof filter, string]> = [
    ["active", "Actifs"],
    ["checked_in", "Présents"],
    ["pending", "En attente"],
    ["cancelled", "Annulés"],
    ["all", "Tous"],
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un nom, e-mail, pseudo, ID Bandai, code billet…" className="max-w-md" />
        <div className="flex gap-1 rounded-full border hairline bg-coal-950 p-1">
          {FILTERS.map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter(key)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition-colors", filter === key ? "bg-gold-400 text-coal-950" : "text-cream-400 hover:text-cream-100")}>
              {label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[13px] text-cream-500">{filtered.length} ligne(s)</span>
      </div>
      {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}

      <div className="surface-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head border-b hairline text-left">
                <th className="px-3 py-3 font-semibold">Code</th>
                <th className="px-3 py-3 font-semibold">Participant</th>
                <th className="px-3 py-3 font-semibold">Compte</th>
                <th className="px-3 py-3 font-semibold">Leader</th>
                <th className="px-3 py-3 font-semibold">Statut</th>
                <th className="px-3 py-3 font-semibold">Paiement</th>
                <th className="px-3 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filtered.map((r) => {
                const expired = r.status === "pending_payment" && r.expires_at && new Date(r.expires_at).getTime() < nowMs;
                return (
                  <tr key={r.id} className={cn(pending && "opacity-70")}>
                    <td className="px-3 py-2.5 font-mono text-xs text-cream-400 whitespace-nowrap">
                      {registrationCode(r.id)}
                      <span className="block text-[10px] text-cream-600">{fmtDate(r.created_at)}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-medium text-cream-100">{r.participant_name}</span>
                      <span className="block text-xs text-cream-600">
                        {r.participant_email}
                        {r.participant_phone ? ` · ${r.participant_phone}` : ""}
                      </span>
                      {r.notes && <span className="block text-[11px] text-amber-200/80 italic">« {r.notes} »</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-cream-300">
                      {r.pseudo ? (
                        <>
                          {r.pseudo}
                          <span className="block text-cream-600 font-mono">{r.bandai_member_id ?? "ID Bandai manquant"}</span>
                        </>
                      ) : (
                        <span className="text-cream-600">Sans compte</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-cream-300">{r.leader_name ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={expired ? "neutral" : (TONES[r.status] ?? "neutral")}>{expired ? "Expirée" : registrationStatusLabel(r.status)}</Badge>
                      {r.checked_in_at && <span className="block text-[10px] text-cream-600 mt-1">{fmtDate(r.checked_in_at)}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-cream-300 whitespace-nowrap">
                      {r.payment_provider ? PROVIDER[r.payment_provider] ?? r.payment_provider : "—"}
                      {r.amount_cents != null && <span className="block text-cream-600">{(r.amount_cents / 100).toFixed(2)} €</span>}
                      {r.invoice_url && (
                        <a href={r.invoice_url} target="_blank" rel="noopener noreferrer" className="text-gold-400 underline-offset-4 hover:underline">
                          Facture
                        </a>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap space-x-2 text-xs">
                      {r.status === "paid" && (
                        <button type="button" disabled={pending} onClick={() => run("Check-in", () => checkInRegistrationAction(r.id))} className="text-emerald-300 hover:underline">
                          Présent
                        </button>
                      )}
                      {r.status === "checked_in" && (
                        <button type="button" disabled={pending} onClick={() => run("Annulation du check-in", () => undoCheckInAction(r.id))} className="text-cream-400 hover:underline">
                          Annuler présence
                        </button>
                      )}
                      {(r.status === "paid" || r.status === "checked_in") && (
                        <button type="button" disabled={pending} onClick={() => run("Renvoi du billet", () => resendTicketAction(r.id))} className="text-gold-400 underline-offset-4 hover:underline">
                          Renvoyer billet
                        </button>
                      )}
                      {r.status === "pending_payment" && (
                        <button type="button" disabled={pending} onClick={() => run("Paiement", () => markPaidManuallyAction(r.id))} className="text-emerald-300 hover:underline">
                          Marquer payé
                        </button>
                      )}
                      {["paid", "checked_in"].includes(r.status) && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            if (window.confirm(`Marquer l'inscription de ${r.participant_name} comme remboursée ? La place sera libérée.`)) run("Remboursement", () => cancelRegistrationAction(r.id, "refunded"));
                          }}
                          className="text-amber-200 hover:underline"
                        >
                          Rembourser
                        </button>
                      )}
                      {r.status === "pending_payment" && (
                        <button type="button" disabled={pending} onClick={() => run("Annulation", () => cancelRegistrationAction(r.id, "cancelled"))} className="text-cream-400 hover:underline">
                          Annuler
                        </button>
                      )}
                      {["pending_payment", "cancelled", "refunded"].includes(r.status) && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            if (window.confirm(`Supprimer définitivement l'inscription de ${r.participant_name} ?`)) run("Suppression", () => deleteRegistrationAction(r.id));
                          }}
                          className="text-red-300 hover:underline"
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-cream-600">
                    Aucune inscription.
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
