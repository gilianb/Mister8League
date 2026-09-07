import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import EventCard, { type MyRegistrationState } from "@/components/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { IconChevronRight } from "@/components/ui/icons";
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
    <div className="page-shell py-12 sm:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
        <PageHeader
          className="mb-0"
          title="Les prochains tournois."
          lede="Réservez votre place en ligne : elle est confirmée dès le paiement et votre billet arrive par e-mail. Les tournois de ligue comptent pour le classement de la saison."
        />
        <figure className="relative hidden aspect-[4/3] overflow-hidden rounded-panel lg:block">
          <Image src="/ambiance/bg-calendrier.jpg" alt="Les joueurs réunis autour des tables de tournoi Mister 8" fill sizes="(min-width: 1024px) 460px, 100vw" className="object-cover" />
        </figure>
      </div>

      <section aria-labelledby="upcoming-heading" className="mt-16">
        <SectionHeading
          title={<span id="upcoming-heading">À venir</span>}
          action={<p className="text-sm text-cream-500">{upcoming.length === 0 ? "Aucune date annoncée" : `${upcoming.length} tournoi${upcoming.length > 1 ? "s" : ""}`}</p>}
        />
        <div className="mt-7">
          {upcoming.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {upcoming.map((e) => (
                <EventCard key={e.id} event={e} mine={mine.get(e.id) ?? null} nowMs={nowMs} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Le prochain tournoi se prépare"
              text="Les nouvelles dates seront annoncées ici et sur Instagram @mister8tournament. Créez votre compte dès maintenant pour être prêt le jour J."
              action={
                user ? undefined : (
                  <Button href="/connexion?mode=inscription" variant="outline">
                    Créer mon compte joueur
                  </Button>
                )
              }
            />
          )}
        </div>
      </section>

      <section aria-labelledby="past-heading" className="mt-20">
        <SectionHeading
          title={<span id="past-heading">Tournois passés</span>}
          action={
            past.length > 0 ? (
              <Link href="/resultats" className="text-link text-sm">
                Tous les résultats
              </Link>
            ) : undefined
          }
        />
        <div className="mt-6">
          {past.length > 0 ? (
            <ul className="divide-y divide-hairline border-y hairline">
              {past.map((e) => (
                <li key={e.id}>
                  <Link
                    href={e.status === "completed" ? `/resultats/${e.slug}` : `/tournois/${e.slug}`}
                    className="group flex flex-wrap items-center gap-x-8 gap-y-2 py-5 transition-colors hover:bg-coal-800/60 sm:px-3"
                  >
                    <time dateTime={e.starts_at} className="tabular w-44 shrink-0 text-sm text-cream-500">
                      {formatDateShort(e.starts_at)}
                    </time>
                    <span className="min-w-48 flex-1 font-display text-xl font-medium tracking-tight text-cream-100 transition-colors group-hover:text-gold-300">
                      {e.title}
                    </span>
                    {e.format_label && <span className="text-xs text-cream-500">{e.format_label}</span>}
                    {e.status === "completed" ? (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-gold-400">
                        Résultats <IconChevronRight size={16} />
                      </span>
                    ) : (
                      <Badge tone="neutral">Résultats à venir</Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-t hairline pt-6 text-sm text-cream-500">Les tournois terminés resteront ici, avec leurs résultats.</p>
          )}
        </div>
      </section>
    </div>
  );
}
