import type { Metadata } from "next";
import Link from "next/link";
import LeaderChip from "@/components/LeaderChip";
import { getDemoPlayerDashboard, getActiveSeason } from "@/lib/data";
import { formatDateShort, placementLabel } from "@/lib/format";

export const metadata: Metadata = {
  title: "Mon espace joueur",
  robots: { index: false },
};

export default async function JoueurPage() {
  const [player, season] = await Promise.all([
    getDemoPlayerDashboard(),
    getActiveSeason(),
  ]);

  const games = player.wins + player.losses + player.draws;
  const winRate = games > 0 ? Math.round((player.wins / games) * 100) : 0;
  const qualified = player.rank <= player.qualifiedCount;
  const pointsGap = Math.max(0, player.cutPoints - player.totalPoints);

  // Échelle de la barre de progression : la coupe à ~80 % de la piste
  const scale = Math.max(player.cutPoints * 1.25, player.totalPoints);
  const fillPct = Math.round((player.totalPoints / scale) * 100);
  const cutPct = Math.round((player.cutPoints / scale) * 100);

  const maxHistPoints = Math.max(...player.history.map((h) => h.leaguePoints), 1);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="mb-8 rounded-lg border border-gold-400/30 bg-gold-400/10 px-4 py-2.5 text-xs text-gold-300">
        Aperçu de démonstration : vos vraies stats apparaîtront ici une fois
        votre compte créé et votre numéro de membre Bandai renseigné.
      </p>

      {/* En-tête */}
      <div className="flex items-center gap-4 mb-8">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold-400 font-display text-xl font-bold text-coal-950 leading-none">
          {player.displayName.charAt(0)}
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-cream-100">
            {player.displayName}
          </h1>
          <p className="text-xs text-cream-600">
            ID Bandai {player.bandaiMemberId} · {season.gameName} · {season.name}
          </p>
        </div>
      </div>

      {/* Statut de qualification */}
      <section className="rounded-2xl border hairline bg-coal-800 p-5 sm:p-6 mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <h2 className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold">
            QUALIFICATION FINALE
          </h2>
          <p className={`text-sm font-bold tracking-wide ${qualified ? "text-gold-400" : "text-cream-100"}`}>
            {placementLabel(player.rank)} au classement ·{" "}
            {qualified
              ? "qualifié provisoirement"
              : `à ${pointsGap} pts du top ${player.qualifiedCount}`}
          </p>
        </div>
        <div className="relative h-2 rounded-full bg-coal-950">
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gold-600 to-gold-400"
            style={{ width: `${fillPct}%` }}
          />
          <span
            className="absolute -top-1 -bottom-1 w-0.5 rounded bg-brand"
            style={{ left: `${cutPct}%` }}
            title={`Coupe top ${player.qualifiedCount}`}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-cream-600 tabular">
          <span>{player.totalPoints} pts</span>
          <span className="text-brand font-semibold">
            coupe top {player.qualifiedCount} : {player.cutPoints} pts
          </span>
        </div>
      </section>

      {/* Tuiles stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { value: String(player.totalPoints), label: "POINTS LIGUE" },
          { value: `${winRate} %`, label: `WIN RATE (${player.wins}-${player.losses}${player.draws ? `-${player.draws}` : ""})` },
          { value: String(player.eventsPlayed), label: "TOURNOIS JOUÉS" },
          { value: placementLabel(player.bestPlacement), label: "MEILLEUR RÉSULTAT" },
        ].map((t) => (
          <div key={t.label} className="rounded-xl bg-coal-800 border hairline px-4 py-3.5">
            <span className="block text-2xl font-bold text-gold-400 tabular">
              {t.value}
            </span>
            <span className="text-[9px] tracking-[0.14em] text-cream-600 font-semibold">
              {t.label}
            </span>
          </div>
        ))}
      </section>

      {/* Points par tournoi */}
      <section className="rounded-2xl border hairline bg-coal-800 p-5 sm:p-6 mb-6">
        <h2 className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold mb-4">
          POINTS PAR TOURNOI
        </h2>
        <div className="flex items-end gap-3 h-28">
          {[...player.history].reverse().map((h) => (
            <div key={h.eventSlug} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <span className="text-xs text-cream-400 tabular">+{h.leaguePoints}</span>
              <span
                className={`w-full rounded-t ${
                  h.leaguePoints === maxHistPoints ? "bg-gold-400" : "bg-coal-700"
                }`}
                style={{ height: `${Math.max(8, (h.leaguePoints / maxHistPoints) * 80)}px` }}
              />
              <span className="text-[9px] text-cream-600 truncate max-w-full">
                {h.eventName.replace(/Tournoi (One Piece|Riftbound)\s*/, "")}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Historique */}
      <section className="rounded-2xl border hairline bg-coal-800 p-5 sm:p-6 mb-6">
        <h2 className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold mb-2">
          MES TOURNOIS
        </h2>
        <ul className="divide-y hairline">
          {player.history.map((h) => (
            <li key={h.eventSlug} className="py-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className={`w-12 shrink-0 font-bold tabular ${h.placement <= 8 ? "text-gold-400" : "text-cream-600"}`}>
                {placementLabel(h.placement)}
              </span>
              <div className="flex-1 min-w-40">
                <Link
                  href={`/resultats/${h.eventSlug}`}
                  className="font-medium text-cream-100 hover:text-gold-400"
                >
                  {h.eventName}
                </Link>
                <p className="text-xs text-cream-600 flex items-center gap-1.5">
                  {formatDateShort(h.date)} · {h.wins}-{h.losses}
                  {h.draws ? `-${h.draws}` : ""} ·{" "}
                  <LeaderChip code={h.leaderCode} name={h.leaderName} size={20} />
                </p>
              </div>
              <span className="text-sm font-bold text-cream-100 tabular">
                +{h.leaguePoints} pts
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Mes decks */}
      <section className="rounded-2xl border hairline bg-coal-800 p-5 sm:p-6">
        <h2 className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold mb-2">
          MES DECKS
        </h2>
        <ul className="divide-y hairline">
          {player.decks.map((d) => {
            const rate = Math.round((d.wins / Math.max(1, d.wins + d.losses)) * 100);
            return (
              <li key={d.leaderName} className="py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex-1 min-w-40 font-medium text-cream-100">
                  <LeaderChip code={d.leaderCode} name={d.leaderName} size={40} />
                </span>
                <span className="text-xs text-cream-600">
                  {d.eventsPlayed} tournoi{d.eventsPlayed > 1 ? "s" : ""} · meilleur :{" "}
                  {placementLabel(d.bestPlacement)}
                </span>
                <span className="w-24 text-right text-sm tabular">
                  <b className="text-gold-400">{rate} %</b>
                  <span className="text-cream-600"> ({d.wins}-{d.losses})</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
