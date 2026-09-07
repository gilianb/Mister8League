import Image from "next/image";
import Link from "next/link";
import AmbianceCarousel from "@/components/AmbianceCarousel";
import Countdown from "@/components/Countdown";
import { PlayerName } from "@/components/StandingsTable";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Ticket, TicketBody, TicketStub } from "@/components/ui/Ticket";
import { PaperPill } from "@/components/EventCard";
import { getActiveSeason, getPointScale } from "@/lib/db/seasons";
import { getNextEvent, listCompletedEvents } from "@/lib/db/events";
import { getSeasonStandings } from "@/lib/db/standings";
import { getSessionUser } from "@/lib/auth/session";
import { formatDateShort, formatTime, placementLabel } from "@/lib/format";
import { formatEuros } from "@/lib/money";
import { eventAvailability, seatsLeft } from "@/lib/tournaments/status";
import { currentTimeMs } from "@/lib/clock";
import type { StandingRow } from "@/lib/db/types";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const dayFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", timeZone: "Europe/Paris" });
const monthFormat = new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "Europe/Paris" });
const weekdayFormat = new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: "Europe/Paris" });

function TopEight({ rows, qualifiedCount }: { rows: StandingRow[]; qualifiedCount: number }) {
  return (
    <ol className="grid gap-x-12 md:grid-cols-2">
      {rows.map((r) => (
        <li key={r.player_id} className="flex items-center gap-5 border-t hairline py-4 last:border-b md:[&:nth-child(4)]:border-b">
          <span className={cn("display-number w-12 shrink-0 text-4xl", r.rank <= qualifiedCount ? "text-gold-400" : "text-cream-500")}>{r.rank}</span>
          <div className="min-w-0 flex-1 text-[15px] font-medium text-cream-100">
            <PlayerName row={r} size={36} />
            <p className="mt-1 pl-[46px] text-xs text-cream-500">
              {r.events_played} tournoi{r.events_played > 1 ? "s" : ""}, meilleur résultat {placementLabel(r.best_placement)}
            </p>
          </div>
          <span className="display-number shrink-0 text-2xl text-cream-100">
            {r.total_points}
            <span className="ml-1 font-sans text-xs font-medium text-cream-500">pts</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export default async function Home() {
  const [season, nextEvent, completed, user] = await Promise.all([getActiveSeason(), getNextEvent(), listCompletedEvents(), getSessionUser()]);
  const [standings, scale] = season ? await Promise.all([getSeasonStandings(season.id), getPointScale(season.id)]) : [[], []];
  const top8 = standings.slice(0, 8);
  const lastEvent = completed[0];
  const qualifiedCount = season?.qualified_count ?? 16;
  const topPoints = scale[0]?.points ?? 15;
  const minPoints = scale.length ? Math.min(...scale.map((r) => r.points)) : 1;
  const maxPlacement = scale.length ? Math.max(...scale.map((r) => r.placementMax ?? 64)) : 64;

  const nowMs = currentTimeMs();
  const availability = nextEvent ? eventAvailability(nextEvent, nowMs) : null;
  const left = nextEvent ? seatsLeft(nextEvent.capacity, nextEvent.seats.active_count) : 0;
  const nextDate = nextEvent ? new Date(nextEvent.starts_at) : null;

  return (
    <>
      {/* ---------- Héros ---------- */}
      <section className="relative isolate overflow-hidden">
        <Image src="/ambiance/hero-bg.jpg" alt="" fill priority sizes="100vw" className="-z-20 object-cover object-[55%_62%]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(27,24,22,0.96)_0%,rgba(27,24,22,0.86)_40%,rgba(27,24,22,0.45)_100%)]" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-linear-to-t from-coal-900 to-transparent" aria-hidden="true" />

        <div className="page-shell grid gap-14 py-20 lg:min-h-[640px] lg:grid-cols-[1.15fr_1fr] lg:items-center lg:py-28">
          <div className="max-w-2xl">
            {season && <p className="kicker">{season.name}</p>}
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] tracking-[-0.03em] text-cream-100 sm:text-6xl lg:text-[4.5rem]">
              La ligue One Piece de Courbevoie.
            </h1>
            <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-cream-300">
              Chaque tournoi joué chez Mister 8 rapporte des points de ligue. En fin de saison, les {qualifiedCount} meilleurs
              joueurs se retrouvent pour la grande finale.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {user ? (
                <Button href="/joueur" size="lg">
                  Mon espace joueur
                </Button>
              ) : (
                <Button href="/connexion?mode=inscription" size="lg">
                  Créer mon compte joueur
                </Button>
              )}
              <Button href="/classement" variant="outline" size="lg">
                Voir le classement
              </Button>
            </div>
          </div>

          {nextEvent && nextDate ? (
            <Ticket className="shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] lg:justify-self-end lg:w-full lg:max-w-md">
              <TicketBody>
                <div className="flex items-start justify-between gap-4">
                  <p className="kicker text-poster">Prochain tournoi</p>
                  {nextEvent.counts_for_league && <PaperPill tone="brand">Compte pour la ligue</PaperPill>}
                </div>
                <div className="mt-5 flex gap-5">
                  <time dateTime={nextEvent.starts_at} className="shrink-0 border-r border-ink/12 pr-5">
                    <span className="display-number block text-[3.5rem] text-ink">{dayFormat.format(nextDate)}</span>
                    <span className="mt-1 block text-[13px] font-semibold text-ink-600">{monthFormat.format(nextDate)}</span>
                  </time>
                  <div className="min-w-0">
                    <h2 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.015em] text-ink">
                      <Link href={`/tournois/${nextEvent.slug}`} className="decoration-poster/60 decoration-2 underline-offset-4 hover:underline">
                        {nextEvent.title}
                      </Link>
                    </h2>
                    <p className="mt-2 text-sm text-ink-600">
                      <span className="capitalize">{weekdayFormat.format(nextDate)}</span>, ouverture à {formatTime(nextEvent.starts_at)}
                    </p>
                    <p className="text-sm text-ink-600">
                      {nextEvent.venue_name ?? "Mister 8 TCG"}, {nextEvent.city}
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <Countdown targetIso={nextEvent.starts_at} tone="paper" />
                </div>
              </TicketBody>
              <TicketStub notches={false} className="flex items-center justify-between gap-4">
                <div>
                  <p className="display-number text-2xl text-ink">{nextEvent.price_cents === 0 ? "Gratuit" : formatEuros(nextEvent.price_cents)}</p>
                  <p className="mt-1 text-xs text-ink-600">
                    {nextEvent.capacity > 0
                      ? left === 0
                        ? `Complet, ${nextEvent.capacity} places`
                        : `${left} places restantes sur ${nextEvent.capacity}`
                      : "Places illimitées"}
                  </p>
                </div>
                <Button href={`/tournois/${nextEvent.slug}`} variant={availability?.open && left > 0 ? "brand" : "paper"}>
                  {availability?.open && left > 0 ? "Réserver ma place" : "Voir le tournoi"}
                </Button>
              </TicketStub>
            </Ticket>
          ) : (
            <div className="surface-panel bg-coal-900/70 p-7 backdrop-blur-sm lg:justify-self-end lg:w-full lg:max-w-md">
              <p className="kicker">Prochain tournoi</p>
              <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-cream-100">La prochaine date arrive.</p>
              <p className="mt-2 text-sm leading-relaxed text-cream-400">
                Le calendrier de la saison est en préparation. Créez votre compte pour être prêt à réserver le jour de
                l&apos;annonce.
              </p>
              <Link href="/calendrier" className="text-link mt-5 inline-block text-sm">
                Voir le calendrier
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ---------- Top 8 ---------- */}
      <section className="page-shell py-16 sm:py-20">
        <SectionHeading
          eyebrow={season?.name}
          title="Le top 8 de la ligue"
          action={
            <Link href="/classement" className="text-link text-sm">
              Classement complet
            </Link>
          }
        />
        <div className="mt-8">
          {top8.length > 0 ? (
            <TopEight rows={top8} qualifiedCount={qualifiedCount} />
          ) : (
            <EmptyState
              compact
              title="Le classement démarre au premier tournoi"
              text="Dès que les résultats d'un tournoi de la saison sont publiés, le top 8 apparaît ici."
            />
          )}
        </div>
      </section>

      {/* ---------- Photos ---------- */}
      <AmbianceCarousel />

      {/* ---------- Mode d'emploi (papier) ---------- */}
      <section className="bg-paper py-20 text-ink sm:py-24">
        <div className="page-shell grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <div>
            <p className="kicker text-poster">La ligue, mode d&apos;emploi</p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.025em] sm:text-5xl">Trois étapes jusqu&apos;à la finale.</h2>
            <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-ink-600">
              La saison se joue tournoi après tournoi. Les points s&apos;additionnent, le classement se lit en direct, et les{" "}
              {qualifiedCount} premiers décrochent leur place pour la finale.
            </p>
            <Button href="/reglement" variant="paper" className="mt-8">
              Lire le règlement
            </Button>
          </div>
          <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6">
            {[
              {
                title: "Jouez",
                text: `Participez aux tournois One Piece à Courbevoie. Chaque placement rapporte des points, de la victoire (${topPoints} pts) au top ${maxPlacement} (${minPoints} pt${minPoints > 1 ? "s" : ""}).`,
              },
              {
                title: "Marquez",
                text: "Vos résultats Bandai TCG+ sont importés après chaque tournoi. Points, bilan, leaders joués : tout est sur votre profil.",
              },
              {
                title: "Qualifiez-vous",
                text: `Les ${qualifiedCount} premiers du classement décrochent leur place pour la grande finale de saison. Les trois premiers y sont invités.`,
              },
            ].map((step, i) => (
              <li key={step.title} className="border-t-2 border-ink pt-5">
                <span className="display-number block text-4xl text-poster">{i + 1}</span>
                <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Dernier tournoi ---------- */}
      {lastEvent && (
        <section className="page-shell py-16 sm:py-20">
          <div className="flex flex-wrap items-center justify-between gap-6 border-y hairline py-8">
            <div className="min-w-0">
              <p className="kicker">Dernier tournoi joué, le {formatDateShort(lastEvent.starts_at)}</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.02em] text-cream-100">{lastEvent.title}</h2>
              <p className="mt-2 text-sm text-cream-400">Classement final, leaders joués et points de ligue attribués.</p>
            </div>
            <Button href={`/resultats/${lastEvent.slug}`} variant="outline">
              Voir les résultats
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
