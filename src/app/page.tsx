import Link from "next/link";
import AmbianceCarousel from "@/components/AmbianceCarousel";
import Countdown from "@/components/Countdown";
import StandingsTable from "@/components/StandingsTable";
import {
  getActiveSeason,
  getNextEventForGame,
  getStandings,
  getPastEvents,
} from "@/lib/data";
import { formatDateLong, formatTime, formatDateShort } from "@/lib/format";

export default async function Home() {
  const [season, nextOnePiece, nextRiftbound, standings, past] =
    await Promise.all([
      getActiveSeason(),
      getNextEventForGame("one-piece"),
      getNextEventForGame("riftbound"),
      getStandings(),
      getPastEvents(),
    ]);
  const top8 = standings.slice(0, 8);
  const lastEvent = past[0];

  return (
    <>
      {/* ---------- Héros « Le Club » ---------- */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(900px 400px at 12% -10%, rgba(246,195,107,.09), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-12">
          <div className="max-w-2xl">
            <p className="text-[11px] tracking-[0.24em] text-gold-400 font-semibold mb-4">
              {season.name.toUpperCase()} · {season.gameName.toUpperCase()} · COURBEVOIE
            </p>
            <h1 className="font-display font-bold text-cream-100 text-4xl sm:text-5xl leading-[1.05] text-balance">
              Une saison. Seize places.{" "}
              <em className="not-italic text-gold-400">Une finale.</em>
            </h1>
            <p className="mt-5 text-cream-400 max-w-[46ch]">
              Chaque tournoi One Piece joué chez Mister 8 rapporte des points
              de ligue. À la fin de la saison, les {season.qualifiedCount}{" "}
              meilleurs joueurs s&apos;affrontent lors de la grande finale.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/connexion"
                className="rounded-lg bg-gold-400 px-5 py-3 font-semibold text-coal-950 hover:bg-gold-300 transition-colors"
              >
                Créer mon compte joueur
              </Link>
              <Link
                href="/classement"
                className="rounded-lg border border-gold-400/40 px-5 py-3 font-medium text-cream-200 hover:border-gold-400 transition-colors"
              >
                Voir le classement
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {nextOnePiece && (
              <div className="rounded-2xl border hairline bg-coal-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-block rounded bg-brand px-2.5 py-1 text-[10px] font-extrabold tracking-[0.14em] text-white">
                    ONE PIECE CARD GAME
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.12em] text-gold-400">
                    COMPTE POUR LA LIGUE
                  </span>
                </div>
                <h2 className="font-display text-xl font-bold text-cream-100">
                  {nextOnePiece.name}
                </h2>
                <p className="mt-1 mb-5 text-sm text-cream-400">
                  {formatDateLong(nextOnePiece.startsAt)} ·{" "}
                  {formatTime(nextOnePiece.startsAt)} · {nextOnePiece.location} ·{" "}
                  {nextOnePiece.capacity} places · {nextOnePiece.priceEuros} €
                </p>
                <Countdown targetIso={nextOnePiece.startsAt} />
                {nextOnePiece.ticketUrl && (
                  <a
                    href={nextOnePiece.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 block rounded-lg bg-brand py-3 text-center font-semibold text-white hover:brightness-110 transition"
                  >
                    S&apos;inscrire sur la billetterie
                  </a>
                )}
              </div>
            )}

            {nextRiftbound && (
              <div className="rounded-2xl border border-rift-400/25 bg-coal-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-block rounded bg-rift-600 px-2.5 py-1 text-[10px] font-extrabold tracking-[0.14em] text-white">
                    RIFTBOUND TCG
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.12em] text-rift-300">
                    HORS LIGUE
                  </span>
                </div>
                <h2 className="font-display text-xl font-bold text-cream-100">
                  {nextRiftbound.name}
                </h2>
                <p className="mt-1 mb-5 text-sm text-cream-400">
                  {formatDateLong(nextRiftbound.startsAt)} ·{" "}
                  {formatTime(nextRiftbound.startsAt)} · {nextRiftbound.location}{" "}
                  · {nextRiftbound.capacity} places · {nextRiftbound.priceEuros} €
                </p>
                <Countdown targetIso={nextRiftbound.startsAt} accent="rift" />
                {nextRiftbound.ticketUrl && (
                  <a
                    href={nextRiftbound.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 block rounded-lg bg-rift-600 py-3 text-center font-semibold text-white hover:brightness-110 transition"
                  >
                    S&apos;inscrire sur la billetterie
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Top 8 ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-2xl font-bold text-cream-100">
            Le top 8 de la ligue
          </h2>
          <Link href="/classement" className="text-sm text-gold-400 hover:underline">
            Classement complet →
          </Link>
        </div>
        <StandingsTable rows={top8} compact />
      </section>

      {/* ---------- Photos d'ambiance ---------- */}
      <AmbianceCarousel />

      {/* ---------- Section « L'Affiche » : mode d'emploi ---------- */}
      <section className="bg-paper text-ink py-14 px-4">
        <div className="mx-auto max-w-4xl poster-frame bg-paper-50 px-6 sm:px-10 py-10 text-center">
          <p className="text-[10px] tracking-[0.3em] text-poster font-extrabold mb-4">
            MISTER 8 TCG · TOURNAMENT LEAGUE
          </p>
          <h2 className="font-poster text-3xl sm:text-4xl leading-tight">
            La ligue, mode d&apos;emploi
          </h2>
          <p className="text-gold-600 tracking-[0.5em] my-4" aria-hidden="true">
            ✦ ✦ ✦
          </p>
          <div className="grid sm:grid-cols-3 gap-8 text-left mt-8">
            <div>
              <p className="font-poster text-poster text-lg mb-2">1. Jouez</p>
              <p className="text-sm text-ink-600">
                Participez aux tournois mensuels One Piece et Riftbound à
                Courbevoie. Chaque placement rapporte des points de ligue, de
                la victoire (15 pts) au top 64 (1 pt).
              </p>
            </div>
            <div>
              <p className="font-poster text-poster text-lg mb-2">2. Grimpez</p>
              <p className="text-sm text-ink-600">
                Vos points s&apos;additionnent sur toute la saison. Suivez
                votre position, vos stats et vos decks depuis votre espace
                joueur, même pendant les tournois.
              </p>
            </div>
            <div>
              <p className="font-poster text-poster text-lg mb-2">3. Qualifiez-vous</p>
              <p className="text-sm text-ink-600">
                Les {season.qualifiedCount} premiers du classement décrochent
                leur place pour la grande finale de saison : titre, lot et
                gloire éternelle au club.
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
                DERNIER TOURNOI · {formatDateShort(lastEvent.startsAt).toUpperCase()}
              </p>
              <h2 className="font-display text-xl font-bold text-cream-100">
                {lastEvent.name}
              </h2>
              <p className="text-sm text-cream-400 mt-1">
                Classement final, leaders joués et decklists du top 8.
              </p>
            </div>
            <Link
              href={`/resultats/${lastEvent.slug}`}
              className="rounded-lg border border-gold-400/60 px-5 py-2.5 text-gold-400 font-medium hover:bg-gold-400 hover:text-coal-950 transition-colors"
            >
              Voir les résultats →
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
