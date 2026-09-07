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
import { formatDateShort, placementLabel } from "@/lib/format";

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
    <div className="page-shell max-w-5xl py-12 sm:py-16">
      <header className="flex flex-wrap items-center gap-6 border-b hairline pb-8">
        <Avatar src={profile.avatar_url} name={profile.pseudo} size={88} />
        <div className="min-w-0 flex-1">
          <p className="kicker">
            Profil joueur
            {season && standing ? `, ${placementLabel(standing.rank)} de la ${season.name}` : ""}
          </p>
          <h1 className="mt-2 truncate font-display text-4xl font-semibold tracking-[-0.025em] text-cream-100 sm:text-5xl">{profile.pseudo}</h1>
          <p className="mt-2 text-sm text-cream-500">Membre depuis le {formatDateShort(profile.created_at)}</p>
          {profile.bio && <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-cream-300">{profile.bio}</p>}
        </div>
        {isMe && (
          <Button href="/joueur/profil" variant="outline" size="sm">
            Modifier mon profil
          </Button>
        )}
      </header>

      <div className="mt-8 space-y-10">
        {season && <QualificationBar standing={standing} qualifiedCount={season.qualified_count} cutPoints={cutPoints(standings, season.qualified_count)} />}
        <StatTiles standing={standing} />
        <PointsBars history={seasonHistory} />
        <HistoryList history={history} />
        <DeckStatsList stats={deckStats} />

        <section>
          <h2 className="font-display text-2xl font-medium tracking-[-0.015em] text-cream-100">Decks publics</h2>
          {decks.length === 0 ? (
            <p className="mt-4 border-t hairline pt-5 text-sm text-cream-400">Aucun deck public.</p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {decks.map((d) => (
                <DeckCard key={d.id} deck={d} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
