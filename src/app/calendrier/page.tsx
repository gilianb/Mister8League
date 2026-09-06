import type { Metadata } from "next";
import Link from "next/link";
import EventCard, { type MyRegistrationState } from "@/components/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { listPastEvents, listUpcomingEvents } from "@/lib/db/events";
import { getMyRegistrations } from "@/lib/db/registrations";
import { getSessionUser } from "@/lib/auth/session";
import { formatDateShort } from "@/lib/format";
import { isActiveRegistration, isPaidStatus } from "@/lib/tournaments/status";
import { currentTimeMs } from "@/lib/clock";

export const metadata: Metadata = {
  title: "Calendrier des tournois",
  description:
    "Les prochains tournois One Piece Card Game de la Mister 8 Tournament League à Courbevoie : inscription en ligne, places restantes et résultats des tournois passés.",
};
export const dynamic = "force-dynamic";

export default async function CalendrierPage() {
  const [upcoming, past, user] = await Promise.all([listUpcomingEvents(), listPastEvents(), getSessionUser()]);
  const nowMs = currentTimeMs();

  const mine = new Map<string, MyRegistrationState>();
  if (user) {
    const regs = await getMyRegistrations();
    for (const r of regs) {
      if (!isActiveRegistration(r, nowMs)) continue;
      mine.set(r.event_id, isPaidStatus(r.status) ? "paid" : "pending");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream-100 mb-2">Calendrier des tournois</h1>
      <p className="text-cream-400 mb-10 max-w-[60ch]">
        Les tournois One Piece comptent pour le classement de la ligue. Inscrivez-vous en ligne : votre place est
        confirmée dès le paiement et votre billet arrive par e-mail.
      </p>

      <h2 className="text-[11px] tracking-[0.22em] text-gold-400 font-semibold mb-4">À VENIR</h2>
      {upcoming.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 mb-14">
          {upcoming.map((e) => (
            <EventCard key={e.id} event={e} mine={mine.get(e.id) ?? null} nowMs={nowMs} />
          ))}
        </div>
      ) : (
        <div className="mb-14">
          <EmptyState
            title="Aucun tournoi programmé pour l'instant"
            text="Le prochain tournoi sera annoncé ici et sur Instagram @mister8tournament."
          />
        </div>
      )}

      <h2 className="text-[11px] tracking-[0.22em] text-cream-600 font-semibold mb-4">TOURNOIS PASSÉS</h2>
      {past.length > 0 ? (
        <ul className="divide-y hairline border-y hairline">
          {past.map((e) => (
            <li key={e.id}>
              <Link
                href={e.status === "completed" ? `/resultats/${e.slug}` : `/tournois/${e.slug}`}
                className="flex flex-wrap items-center gap-x-6 gap-y-1 py-4 px-1 hover:bg-coal-800/60 transition-colors"
              >
                <span className="text-sm text-cream-600 tabular w-36 shrink-0">{formatDateShort(e.starts_at)}</span>
                <span className="font-medium text-cream-100 flex-1 min-w-48">{e.title}</span>
                {e.format_label && <span className="text-xs text-cream-600 border hairline rounded px-2 py-0.5">{e.format_label}</span>}
                {e.status === "completed" ? (
                  <span className="text-sm text-gold-400">Résultats →</span>
                ) : (
                  <Badge tone="neutral">Résultats à venir</Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-cream-600">Aucun tournoi passé pour cette saison.</p>
      )}
    </div>
  );
}
