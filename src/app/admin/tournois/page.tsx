import type { Metadata } from "next";
import Link from "next/link";
import { listAllEvents } from "@/lib/db/events";
import { formatDateTime } from "@/lib/format";
import { formatEuros } from "@/lib/money";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Tournois · Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, BadgeTone> = { draft: "neutral", published: "good", cancelled: "bad", completed: "gold" };
const STATUS_LABEL: Record<string, string> = { draft: "Brouillon", published: "Publié", cancelled: "Annulé", completed: "Terminé" };

type Props = { searchParams: Promise<{ msg?: string }> };

export default async function AdminTournoisPage({ searchParams }: Props) {
  const { msg } = await searchParams;
  const events = await listAllEvents();

  return (
    <div className="space-y-6">
      <SectionHeading
        as="h1"
        size="lg"
        title="Tournois"
        action={
          <Button href="/admin/tournois/nouveau" size="sm">
            + Nouveau tournoi
          </Button>
        }
      />
      {msg === "supprime" && <Alert tone="success">Tournoi supprimé.</Alert>}

      {events.length === 0 ? (
        <EmptyState title="Aucun tournoi" text="Créez votre premier tournoi : il reste en brouillon jusqu'à publication." action={<Button href="/admin/tournois/nouveau">Créer un tournoi</Button>} />
      ) : (
        <div className="rounded-2xl border hairline bg-coal-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-[0.16em] text-cream-600 text-left border-b hairline">
                  <th className="px-4 py-3 font-semibold">TOURNOI</th>
                  <th className="px-4 py-3 font-semibold">DATE</th>
                  <th className="px-4 py-3 font-semibold">STATUT</th>
                  <th className="px-4 py-3 font-semibold text-right">INSCRITS</th>
                  <th className="px-4 py-3 font-semibold text-right">TARIF</th>
                  <th className="px-4 py-3 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y hairline">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-coal-700/30">
                    <td className="px-4 py-3">
                      <Link href={`/admin/tournois/${e.id}`} className="font-medium text-cream-100 hover:text-gold-400">
                        {e.title}
                      </Link>
                      <p className="text-xs text-cream-600">
                        /tournois/{e.slug}
                        {e.format_label ? ` · ${e.format_label}` : ""}
                        {!e.counts_for_league && " · hors ligue"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-cream-300 whitespace-nowrap">{formatDateTime(e.starts_at)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular text-cream-300">
                      <b className="text-gold-400">{e.seats.paid_count}</b>
                      {e.capacity > 0 ? ` / ${e.capacity}` : ""}
                      {e.seats.checked_in_count > 0 && <span className="text-cream-600"> · {e.seats.checked_in_count} présents</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular text-cream-300">{formatEuros(e.price_cents)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link href={`/admin/tournois/${e.id}/participants`} className="text-xs text-gold-400 hover:underline mr-3">
                        Participants
                      </Link>
                      <Link href={`/admin/tournois/${e.id}/resultats`} className="text-xs text-gold-400 hover:underline mr-3">
                        Résultats
                      </Link>
                      <Link href={`/admin/tournois/${e.id}`} className="text-xs text-cream-300 hover:underline">
                        Modifier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
