import type { Metadata } from "next";
import Link from "next/link";
import { getUpcomingEvents, getPastEvents } from "@/lib/data";
import { formatDateLong, formatDateShort, formatTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Calendrier des tournois",
  description:
    "Les prochains tournois One Piece Card Game et Riftbound de la Mister 8 Tournament League à Courbevoie, et les résultats des tournois passés.",
};

export default async function CalendrierPage() {
  const [upcoming, past] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream-100 mb-2">
        Calendrier des tournois
      </h1>
      <p className="text-cream-400 mb-10 max-w-[60ch]">
        Les tournois One Piece comptent pour le classement de la ligue ;
        les tournois Riftbound sont hors ligue. L&apos;inscription se fait
        sur notre billetterie mister-8.com.
      </p>

      <h2 className="text-[11px] tracking-[0.22em] text-gold-400 font-semibold mb-4">
        À VENIR
      </h2>
      <div className="grid gap-5 md:grid-cols-2 mb-14">
        {upcoming.map((e) => {
          const isRift = e.gameSlug === "riftbound";
          return (
          <article
            key={e.slug}
            className="bg-paper text-ink poster-frame p-6 sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <p className={`text-[10px] tracking-[0.24em] font-extrabold ${isRift ? "text-rift-600" : "text-poster"}`}>
                {e.gameName.toUpperCase()}
              </p>
              <span className={`shrink-0 text-[10px] font-bold tracking-wider px-2 py-1 ${isRift ? "bg-rift-600 text-white" : "bg-ink text-gold-400"}`}>
                {e.formatLabel}
              </span>
            </div>
            <h3 className="font-poster text-2xl mt-3 leading-snug">{e.name}</h3>
            <p className={`mt-1 text-[11px] font-semibold tracking-wide ${isRift ? "text-rift-600" : "text-poster"}`}>
              {isRift
                ? "Hors ligue : ne compte pas pour le classement"
                : "Compte pour la ligue One Piece"}
            </p>
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex items-baseline">
                <dt className="text-ink-600">Date</dt>
                <dd className="flex-1 border-b-2 border-dotted border-ink/40 mx-2" aria-hidden="true" />
                <dd className="font-semibold tabular">{formatDateLong(e.startsAt)}</dd>
              </div>
              <div className="flex items-baseline">
                <dt className="text-ink-600">Ouverture</dt>
                <dd className="flex-1 border-b-2 border-dotted border-ink/40 mx-2" aria-hidden="true" />
                <dd className="font-semibold">{formatTime(e.startsAt)}</dd>
              </div>
              <div className="flex items-baseline">
                <dt className="text-ink-600">Lieu</dt>
                <dd className="flex-1 border-b-2 border-dotted border-ink/40 mx-2" aria-hidden="true" />
                <dd className="font-semibold">{e.location}</dd>
              </div>
              <div className="flex items-baseline">
                <dt className="text-ink-600">Places · tarif</dt>
                <dd className="flex-1 border-b-2 border-dotted border-ink/40 mx-2" aria-hidden="true" />
                <dd className="font-semibold tabular">
                  {e.capacity} · {e.priceEuros} €
                </dd>
              </div>
            </dl>
            {e.ticketUrl && (
              <a
                href={e.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-6 block text-paper-50 text-center font-bold py-3 tracking-wide hover:brightness-110 transition ${isRift ? "bg-rift-600" : "bg-poster"}`}
              >
                S&apos;INSCRIRE · {e.priceEuros} €
              </a>
            )}
          </article>
          );
        })}
      </div>

      <h2 className="text-[11px] tracking-[0.22em] text-cream-600 font-semibold mb-4">
        TOURNOIS PASSÉS
      </h2>
      <ul className="divide-y hairline border-y hairline">
        {past.map((e) => (
          <li key={e.slug}>
            <Link
              href={`/resultats/${e.slug}`}
              className="flex flex-wrap items-center gap-x-6 gap-y-1 py-4 px-1 hover:bg-coal-800/60 transition-colors"
            >
              <span className="text-sm text-cream-600 tabular w-36 shrink-0">
                {formatDateShort(e.startsAt)}
              </span>
              <span className="font-medium text-cream-100 flex-1 min-w-48">
                {e.name}
              </span>
              <span className="text-xs text-cream-600 border hairline rounded px-2 py-0.5">
                {e.formatLabel}
              </span>
              <span className="text-sm text-gold-400">Résultats →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
