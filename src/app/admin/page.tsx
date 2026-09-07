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
import { PageHeader } from "@/components/ui/PageHeader";
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

  const upcoming = events
    .filter((e) => (e.status === "published" || e.status === "draft") && new Date(e.starts_at).getTime() > currentTimeMs() - 12 * 3_600_000)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const awaitingResults = events.filter((e) => e.status === "published" && new Date(e.starts_at).getTime() <= currentTimeMs());
  const revenueCents = events.reduce((s, e) => s + e.seats.paid_count * e.price_cents, 0);

  return (
    <div className="space-y-10">
      <PageHeader
        size="md"
        className="mb-0"
        eyebrow={season?.name}
        title="Tableau de bord"
        actions={<Button href="/admin/tournois/nouveau">Nouveau tournoi</Button>}
      />

      <section className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        <StatTile value={upcoming.length} label="Tournois à venir" />
        <StatTile value={pendingCount ?? 0} label="Paiements en attente" accent={pendingCount ? "brand" : "cream"} />
        <StatTile value={profilesCount ?? 0} label="Comptes joueurs" sub={playersNoAccount ? `${playersNoAccount} joueur(s) importé(s) sans compte` : undefined} accent="cream" />
        <StatTile value={formatEuros(revenueCents)} label="Inscriptions encaissées" sub="hors frais" accent="cream" />
      </section>

      {awaitingResults.length > 0 && (
        <section className="rounded-panel border-l-4 border-amber-400 bg-amber-400/8 p-5 sm:p-6">
          <h2 className="font-display text-xl font-medium tracking-tight text-cream-100">Résultats à publier</h2>
          <ul className="mt-3 divide-y divide-hairline">
            {awaitingResults.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span className="text-cream-100">
                  {e.title} <span className="text-cream-500">({formatDateShort(e.starts_at)})</span>
                </span>
                <Button href={`/admin/tournois/${e.id}/resultats`} size="sm" variant="outline">
                  Importer le CSV Bandai
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionHeading
          title="Prochains tournois"
          action={
            <Link href="/admin/tournois" className="text-link text-sm">
              Tous les tournois
            </Link>
          }
        />
        {upcoming.length === 0 ? (
          <p className="mt-4 border-t hairline pt-5 text-sm text-cream-400">Aucun tournoi programmé. Créez-en un pour ouvrir les inscriptions.</p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline border-y hairline">
            {upcoming.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 py-4">
                <div className="min-w-52 flex-1">
                  <Link href={`/admin/tournois/${e.id}`} className="font-medium text-cream-100 transition-colors hover:text-gold-300">
                    {e.title}
                  </Link>
                  <p className="mt-0.5 text-[13px] text-cream-500">{formatDateTime(e.starts_at)}</p>
                </div>
                <Badge tone={STATUS_TONE[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                <span className="tabular text-sm text-cream-300">
                  <span className="font-semibold text-gold-400">{e.seats.paid_count}</span>
                  {e.capacity > 0 ? ` / ${e.capacity}` : ""} inscrits
                  {e.seats.active_count > e.seats.paid_count && <span className="text-cream-500">, {e.seats.active_count - e.seats.paid_count} en attente</span>}
                </span>
                <Link href={`/admin/tournois/${e.id}/participants`} className="text-link text-[13px]">
                  Participants
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeading title="Dernières inscriptions" />
        {!recent || recent.length === 0 ? (
          <p className="mt-4 border-t hairline pt-5 text-sm text-cream-400">Aucune inscription pour l&apos;instant.</p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline border-y hairline text-sm">
            {recent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-5 gap-y-1 py-3">
                <span className="tabular w-36 shrink-0 text-[13px] text-cream-500">{formatDateTime(r.created_at)}</span>
                <span className="min-w-40 flex-1 text-cream-100">
                  {r.participant_name} <span className="text-cream-500">({r.event?.title ?? "—"})</span>
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
