import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { listAllEvents } from "@/lib/db/events";
import { getActiveSeason } from "@/lib/db/seasons";
import { formatDateShort, formatDateTime } from "@/lib/format";
import { formatEuros } from "@/lib/money";
import { StatTile } from "@/components/ui/StatTile";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { registrationStatusLabel } from "@/lib/tournaments/status";
import { currentTimeMs } from "@/lib/clock";

export const metadata: Metadata = { title: "Administration", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, BadgeTone> = { draft: "neutral", published: "good", cancelled: "bad", completed: "gold" };
const STATUS_LABEL: Record<string, string> = { draft: "Brouillon", published: "Publié", cancelled: "Annulé", completed: "Terminé" };

type RecentReg = {
  id: string;
  status: string;
  participant_name: string;
  amount_cents: number | null;
  created_at: string;
  event: { title: string; slug: string } | null;
};

export default async function AdminHome() {
  const supabase = await createServerSupabase();
  const nowIso = new Date().toISOString();
  const [events, season, { count: playersNoAccount }, { count: pendingCount }, { data: recent }, { count: profilesCount }] = await Promise.all([
    listAllEvents(),
    getActiveSeason(),
    supabase.from("players").select("id", { count: "exact", head: true }).is("profile_id", null).is("merged_into", null),
    supabase.from("registrations").select("id", { count: "exact", head: true }).eq("status", "pending_payment").gt("expires_at", nowIso),
    supabase.from("registrations").select("id, status, participant_name, amount_cents, created_at, event:events(title, slug)").order("created_at", { ascending: false }).limit(8).returns<RecentReg[]>(),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const upcoming = events.filter((e) => (e.status === "published" || e.status === "draft") && new Date(e.starts_at).getTime() > currentTimeMs() - 12 * 3_600_000).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const awaitingResults = events.filter((e) => e.status === "published" && new Date(e.starts_at).getTime() <= currentTimeMs());
  const revenueCents = events.reduce((s, e) => s + e.seats.paid_count * e.price_cents, 0);

  return (
    <div className="space-y-8">
      <SectionHeading
        as="h1"
        size="lg"
        title="Tableau de bord"
        action={
          <Button href="/admin/tournois/nouveau" size="sm">
            + Nouveau tournoi
          </Button>
        }
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile value={upcoming.length} label="Tournois à venir" />
        <StatTile value={pendingCount ?? 0} label="Paiements en attente" accent={pendingCount ? "brand" : "gold"} />
        <StatTile value={profilesCount ?? 0} label="Comptes joueurs" sub={playersNoAccount ? `${playersNoAccount} joueur(s) importé(s) sans compte` : undefined} />
        <StatTile value={formatEuros(revenueCents)} label="Inscriptions encaissées" sub="hors frais" />
      </section>

      {awaitingResults.length > 0 && (
        <section className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
          <h2 className="text-[11px] tracking-[0.2em] text-amber-200 font-semibold mb-3">RÉSULTATS À PUBLIER</h2>
          <ul className="space-y-2">
            {awaitingResults.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-cream-100">
                  {e.title} <span className="text-cream-600">· {formatDateShort(e.starts_at)}</span>
                </span>
                <Button href={`/admin/tournois/${e.id}/resultats`} size="sm" variant="outline">
                  Importer le CSV Bandai
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border hairline bg-coal-800 p-5 sm:p-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold">PROCHAINS TOURNOIS{season ? ` · ${season.name.toUpperCase()}` : ""}</h2>
          <Link href="/admin/tournois" className="text-xs text-gold-400 hover:underline">
            Tous les tournois →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-cream-400">Aucun tournoi programmé. Créez-en un pour ouvrir les inscriptions.</p>
        ) : (
          <ul className="divide-y hairline">
            {upcoming.map((e) => (
              <li key={e.id} className="py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                <div className="flex-1 min-w-52">
                  <Link href={`/admin/tournois/${e.id}`} className="font-medium text-cream-100 hover:text-gold-400">
                    {e.title}
                  </Link>
                  <p className="text-xs text-cream-600">{formatDateTime(e.starts_at)}</p>
                </div>
                <Badge tone={STATUS_TONE[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                <span className="text-sm tabular text-cream-300">
                  <b className="text-gold-400">{e.seats.paid_count}</b>
                  {e.capacity > 0 ? ` / ${e.capacity}` : ""} inscrits
                  {e.seats.active_count > e.seats.paid_count && <span className="text-cream-600"> · {e.seats.active_count - e.seats.paid_count} en attente</span>}
                </span>
                <Link href={`/admin/tournois/${e.id}/participants`} className="text-xs text-gold-400 hover:underline">
                  Participants
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border hairline bg-coal-800 p-5 sm:p-6">
        <h2 className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold mb-3">DERNIÈRES INSCRIPTIONS</h2>
        {!recent || recent.length === 0 ? (
          <p className="text-sm text-cream-400">Aucune inscription pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y hairline text-sm">
            {recent.map((r) => (
              <li key={r.id} className="py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="text-cream-600 text-xs w-32 shrink-0">{formatDateTime(r.created_at)}</span>
                <span className="flex-1 min-w-40 text-cream-100">
                  {r.participant_name} <span className="text-cream-600">· {r.event?.title ?? "—"}</span>
                </span>
                <span className="tabular text-cream-300">{r.amount_cents != null ? formatEuros(r.amount_cents) : "—"}</span>
                <Badge tone={r.status === "paid" || r.status === "checked_in" ? "good" : r.status === "pending_payment" ? "warn" : "neutral"}>{registrationStatusLabel(r.status)}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
