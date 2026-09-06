import Link from "next/link";
import AmbianceCarousel from "@/components/AmbianceCarousel";
import Countdown from "@/components/Countdown";
import StandingsTable from "@/components/StandingsTable";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getActiveSeason, getPointScale } from "@/lib/db/seasons";
import { getNextEvent, listCompletedEvents } from "@/lib/db/events";
import { getSeasonStandings } from "@/lib/db/standings";
import { getSessionUser } from "@/lib/auth/session";
import { formatDateLong, formatDateShort, formatTime } from "@/lib/format";
import { formatEuros } from "@/lib/money";
import { eventAvailability, seatsLeft } from "@/lib/tournaments/status";
import { currentTimeMs } from "@/lib/clock";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [season, nextEvent, completed, user] = await Promise.all([
    getActiveSeason(),
    getNextEvent(),
    listCompletedEvents(),
    getSessionUser(),
  ]);
  const [standings, scale] = season
    ? await Promise.all([getSeasonStandings(season.id), getPointScale(season.id)])
    : [[], []];
  const top8 = standings.slice(0, 8);
  const lastEvent = completed[0];
  const qualifiedCount = season?.qualified_count ?? 16;
  const topPoints = scale[0]?.points ?? 15;
  const minPoints = scale.length ? Math.min(...scale.map((r) => r.points)) : 1;
  const maxPlacement = scale.length ? Math.max(...scale.map((r) => r.placementMax ?? 64)) : 64;

  const nowMs = currentTimeMs();
  const availability = nextEvent ? eventAvailability(nextEvent, nowMs) : null;
  const left = nextEvent ? seatsLeft(nextEvent.capacity, nextEvent.seats.active_count) : 0;

  return (
    <>
      {/* ---------- Héros « Le Club » ---------- */}
      <section className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ambiance/hero-bg.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[30%_88%] opacity-[0.18] pointer-events-none"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(34,31,28,.5), rgba(34,31,28,.15) 45%, #221f1c 100%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(900px 400px at 12% -10%, rgba(246,195,107,.09), transparent 60%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-12">
          <div className="max-w-2xl">
            <p className="text-[11px] tracking-[0.24em] text-gold-400 font-semibold mb-4">
              {(season?.name ?? "LA LIGUE").toUpperCase()} · ONE PIECE CARD GAME · COURBEVOIE
            </p>
            <h1 className="font-display font-bold text-cream-100 text-4xl sm:text-5xl leading-[1.05] text-balance">
              Une saison. {qualifiedCount === 16 ? "Seize" : qualifiedCount} places.{" "}
              <em className="not-italic text-gold-400">Une finale.</em>
            </h1>
            <p className="mt-5 text-cream-400 max-w-[46ch]">
              Chaque tournoi One Piece joué chez Mister 8 rapporte des points de ligue. À la fin de la saison, les{" "}
              {qualifiedCount} meilleurs joueurs s&apos;affrontent lors de la grande finale.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
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

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {nextEvent ? (
              <div className="rounded-2xl border hairline bg-coal-800 p-6">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="inline-block rounded bg-brand px-2.5 py-1 text-[10px] font-extrabold tracking-[0.14em] text-white">
                    PROCHAIN TOURNOI
                  </span>
                  {nextEvent.counts_for_league && (
                    <span className="text-[10px] font-bold tracking-[0.12em] text-gold-400">COMPTE POUR LA LIGUE</span>
                  )}
                </div>
                <h2 className="font-display text-xl font-bold text-cream-100">
                  <Link href={`/tournois/${nextEvent.slug}`} className="hover:text-gold-400">
                    {nextEvent.title}
                  </Link>
                </h2>
                <p className="mt-1 mb-5 text-sm text-cream-400">
                  {formatDateLong(nextEvent.starts_at)} · {formatTime(nextEvent.starts_at)} · {nextEvent.city}
                  {nextEvent.capacity > 0 && ` · ${nextEvent.capacity} places`} · {formatEuros(nextEvent.price_cents)}
                </p>
                <Countdown targetIso={nextEvent.starts_at} />
                <Link
                  href={`/tournois/${nextEvent.slug}`}
                  className="mt-5 block rounded-lg bg-brand py-3 text-center font-semibold text-white hover:brightness-110 transition"
                >
                  {availability?.open && left > 0
                    ? `S'inscrire · ${left === Infinity ? "places illimitées" : `${left} places restantes`}`
                    : left === 0
                      ? "Complet · voir le tournoi"
                      : "Voir le tournoi"}
                </Link>
              </div>
            ) : (
              <EmptyState
                title="Prochain tournoi bientôt annoncé"
                text="Le calendrier de la saison est en préparation. Créez votre compte pour être prêt le jour J."
                compact
              />
            )}

            <div className="rounded-2xl border border-gold-400/20 bg-coal-800 p-6">
              <p className="text-[10px] font-bold tracking-[0.14em] text-gold-400 mb-3">COMMENT ÇA MARCHE</p>
              <ol className="space-y-3 text-sm text-cream-300">
                <li className="flex gap-3">
                  <span className="font-display font-bold text-gold-400">1.</span>
                  Créez votre compte avec votre numéro de membre Bandai.
                </li>
                <li className="flex gap-3">
                  <span className="font-display font-bold text-gold-400">2.</span>
                  Inscrivez-vous en ligne aux tournois, votre billet arrive par e-mail.
                </li>
                <li className="flex gap-3">
                  <span className="font-display font-bold text-gold-400">3.</span>
                  Vos résultats Bandai TCG+ alimentent automatiquement votre classement.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Photos d'ambiance ---------- */}
      <AmbianceCarousel />

      {/* ---------- Top 8 ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-2xl font-bold text-cream-100">Le top 8 de la ligue</h2>
          <Link href="/classement" className="text-sm text-gold-400 hover:underline">
            Classement complet →
          </Link>
        </div>
        {top8.length > 0 ? (
          <StandingsTable rows={top8} compact />
        ) : (
          <EmptyState
            compact
            title="Le classement démarre au premier tournoi"
            text="Dès que les résultats d'un tournoi de la saison sont publiés, le top 8 apparaît ici."
          />
        )}
      </section>

      {/* ---------- Section « L'Affiche » : mode d'emploi ---------- */}
      <section className="bg-paper text-ink py-14 px-4">
        <div className="mx-auto max-w-4xl poster-frame bg-paper-50 px-6 sm:px-10 py-10 text-center">
          <p className="text-[10px] tracking-[0.3em] text-poster font-extrabold mb-4">MISTER 8 TCG · TOURNAMENT LEAGUE</p>
          <h2 className="font-poster text-3xl sm:text-4xl leading-tight">La ligue, mode d&apos;emploi</h2>
          <p className="text-gold-600 tracking-[0.5em] my-4" aria-hidden="true">
            ✦ ✦ ✦
          </p>
          <div className="grid sm:grid-cols-3 gap-8 text-left mt-8">
            <div>
              <p className="font-poster text-poster text-lg mb-2">1. Jouez</p>
              <p className="text-sm text-ink-600">
                Participez aux tournois One Piece à Courbevoie. Chaque placement rapporte des points de ligue, de la
                victoire ({topPoints} pts) au top {maxPlacement} ({minPoints} pt{minPoints > 1 ? "s" : ""}).
              </p>
            </div>
            <div>
              <p className="font-poster text-poster text-lg mb-2">2. Grimpez</p>
              <p className="text-sm text-ink-600">
                Vos points s&apos;additionnent sur toute la saison. Suivez votre position, vos stats et vos decks depuis
                votre espace joueur.
              </p>
            </div>
            <div>
              <p className="font-poster text-poster text-lg mb-2">3. Qualifiez-vous</p>
              <p className="text-sm text-ink-600">
                Les {qualifiedCount} premiers du classement décrochent leur place pour la grande finale de saison :
                titre, lot et gloire éternelle au club.
              </p>
            </div>
          </div>
          <Link
            href="/reglement"
            className="mt-10 inline-block bg-ink px-8 py-3.5 font-poster text-gold-400 tracking-wider shadow-[5px_5px_0_#c9331f] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_#c9331f] transition-all"
          >
            LIRE LE RÈGLEMENT
          </Link>
        </div>
      </section>

      {/* ---------- Derniers résultats ---------- */}
      {lastEvent && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="rounded-2xl border hairline bg-coal-800 p-6 sm:p-8 flex flex-wrap items-center gap-6 justify-between">
            <div>
              <p className="text-[10px] tracking-[0.2em] text-cream-600 font-semibold mb-1">
                DERNIER TOURNOI · {formatDateShort(lastEvent.starts_at).toUpperCase()}
              </p>
              <h2 className="font-display text-xl font-bold text-cream-100">{lastEvent.title}</h2>
              <p className="text-sm text-cream-400 mt-1">Classement final, leaders joués et points de ligue.</p>
            </div>
            <Button href={`/resultats/${lastEvent.slug}`} variant="outline">
              Voir les résultats →
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
