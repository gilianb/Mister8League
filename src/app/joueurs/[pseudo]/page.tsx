import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProfileByPseudo, getPlayerDeckStats, getPlayerHistory } from "@/lib/db/players";
import { getActiveSeason } from "@/lib/db/seasons";
import { cutPoints, getPlayerStanding, getSeasonStandings } from "@/lib/db/standings";
import { listPublicDecks } from "@/lib/db/decks";
import { createServerSupabase } from "@/lib/supabase/server";
import type { PlayerRow } from "@/lib/db/types";
import { getSessionUser } from "@/lib/auth/session";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { PointsBars, QualificationBar, StatTiles } from "@/components/PlayerStats";
import { DeckStatsList, HistoryList } from "@/components/PlayerHistory";
import DeckCard from "@/components/DeckCard";
import { formatDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ pseudo: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pseudo } = await params;
  const profile = await getPublicProfileByPseudo(decodeURIComponent(pseudo));
  if (!profile || !profile.is_public) return {};
  return { title: `${profile.pseudo} · profil joueur`, description: `Résultats, points de ligue et decks de ${profile.pseudo} à la Mister 8 Tournament League.` };
}

export default async function JoueurPublicPage({ params }: Props) {
  const { pseudo } = await params;
  const profile = await getPublicProfileByPseudo(decodeURIComponent(pseudo));
  if (!profile || !profile.is_public || !profile.pseudo) notFound();

  const supabase = await createServerSupabase();
  const [{ data: player }, season, viewer] = await Promise.all([
    supabase.from("players").select("*").eq("profile_id", profile.id).is("merged_into", null).maybeSingle<PlayerRow>(),
    getActiveSeason(),
    getSessionUser(),
  ]);

  const [standing, standings, history, deckStats, decks] = await Promise.all([
    season && player ? getPlayerStanding(season.id, player.id) : Promise.resolve(null),
    season ? getSeasonStandings(season.id) : Promise.resolve([]),
    player ? getPlayerHistory(player.id) : Promise.resolve([]),
    player && season ? getPlayerDeckStats(player.id, season.id) : Promise.resolve([]),
    listPublicDecks(profile.id),
  ]);
  const seasonHistory = season ? history.filter((h) => h.season_id === season.id) : history;
  const isMe = viewer?.id === profile.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar src={profile.avatar_url} name={profile.pseudo} size={72} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] tracking-[0.24em] text-gold-400 font-semibold">PROFIL JOUEUR</p>
          <h1 className="font-display text-3xl font-bold text-cream-100 truncate">{profile.pseudo}</h1>
          <p className="text-xs text-cream-600">
            Membre depuis {formatDateShort(profile.created_at)}
            {season && standing ? ` · ${standing.rank}e de la ${season.name}` : ""}
          </p>
          {profile.bio && <p className="mt-2 text-sm text-cream-300 max-w-[60ch]">{profile.bio}</p>}
        </div>
        {isMe && (
          <Button href="/joueur/profil" variant="outline" size="sm">
            Modifier mon profil
          </Button>
        )}
      </div>

      {season && <QualificationBar standing={standing} qualifiedCount={season.qualified_count} cutPoints={cutPoints(standings, season.qualified_count)} />}
      <StatTiles standing={standing} />
      <PointsBars history={seasonHistory} />
      <HistoryList history={history} />
      <DeckStatsList stats={deckStats} />

      <section className="rounded-2xl border hairline bg-coal-800 p-5 sm:p-6">
        <h2 className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold mb-3">DECKS</h2>
        {decks.length === 0 ? (
          <p className="text-sm text-cream-400">Aucun deck public.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {decks.map((d) => (
              <DeckCard key={d.id} deck={d} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
