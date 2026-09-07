import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getActiveSeason, getPointScale } from "@/lib/db/seasons";

export const metadata: Metadata = {
  title: "Règlement de la ligue",
  description:
    "Le règlement officiel de la Ligue Mister 8 Tournament (M8T) : barème de points, qualification pour la finale et comptes joueurs.",
};

export const dynamic = "force-dynamic";

const TOC: Array<[string, string]> = [
  ["saison", "La saison"],
  ["points", "Le barème des points"],
  ["finale", "Qualification et finale"],
  ["resultats", "Résultats et comptes joueurs"],
  ["inscriptions", "Inscriptions, retards et remboursements"],
  ["donnees", "Données personnelles"],
];

function Article({ id, index, title, children }: { id: string; index: number; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-ink/12 py-10 first:border-t-0 first:pt-0">
      <h2 className="font-display text-[1.75rem] font-semibold tracking-[-0.015em] text-ink">
        <span className="text-poster">{index}.</span> {title}
      </h2>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-ink-600 [&_strong]:text-ink">{children}</div>
    </section>
  );
}

function Callout({ tone = "gold", children }: { tone?: "gold" | "brand" | "rift"; children: ReactNode }) {
  const border = tone === "gold" ? "border-gold-600" : tone === "brand" ? "border-poster" : "border-rift-600";
  return <aside className={`rounded-control border-l-4 bg-ink/4 px-5 py-4 text-[15px] leading-7 text-ink-600 [&_strong]:text-ink ${border}`}>{children}</aside>;
}

export default async function ReglementPage() {
  const season = await getActiveSeason();
  const scale = season ? await getPointScale(season.id) : [];
  const qualifiedCount = season?.qualified_count ?? 16;
  const seasonName = season?.name ?? "la saison en cours";

  return (
    <div className="bg-paper text-ink">
      <div className="page-shell py-14 sm:py-20">
        <header className="max-w-3xl">
          <p className="kicker text-poster">{season ? season.name : "Mister 8 Tournament League"}</p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-6xl">Règlement de la ligue.</h1>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-ink-600">
            Tout ce qu&apos;il faut savoir pour jouer la saison Mister 8 Tournament et viser la finale.
          </p>
        </header>

        <div className="mt-14 grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20">
          <aside>
            <div className="lg:sticky lg:top-28">
              <p className="text-sm font-semibold text-ink">Sommaire</p>
              <nav aria-label="Sommaire du règlement">
                <ol className="mt-4 divide-y divide-ink/10 border-y border-ink/12">
                  {TOC.map(([id, label], i) => (
                    <li key={id}>
                      <a href={`#${id}`} className="flex gap-3 py-3 text-sm text-ink-600 transition-colors hover:text-poster">
                        <span className="tabular w-4 shrink-0 text-poster">{i + 1}</span>
                        {label}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
              <Link href="/classement" className="mt-6 inline-block text-sm font-semibold text-poster underline underline-offset-4">
                Voir le classement de la saison
              </Link>
            </div>
          </aside>

          <article className="max-w-3xl">
            <Article id="saison" index={1} title="La saison">
              <p>
                La {seasonName} regroupe l&apos;ensemble des tournois One Piece Card Game officiellement organisés par Mister 8
                TCG. Chaque tournoi joué rapporte des points de ligue selon votre classement final. Ces points
                s&apos;additionnent tout au long de la saison pour former le classement général.
              </p>
              <p>
                <strong>Départage :</strong> en cas d&apos;égalité de points au classement général, le meilleur placement
                individuel obtenu lors d&apos;un tournoi sur la saison sert de critère de départage.
              </p>
              <Callout tone="rift">
                Les tournois « Riftbound » organisés par Mister 8 sont des événements hors ligue et ne rapportent aucun point
                pour le moment.
              </Callout>
            </Article>

            <Article id="points" index={2} title="Le barème des points de ligue">
              <div className="overflow-hidden rounded-control border border-ink/12">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ink text-left text-paper-50">
                      <th scope="col" className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.06em]">
                        Placement
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em]">
                        Points de ligue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scale.map((r) => (
                      <tr key={r.label} className="border-t border-ink/10 odd:bg-paper-50">
                        <td className="px-5 py-3.5 font-medium text-ink">{r.label}</td>
                        <td className="display-number px-5 py-3.5 text-right text-xl text-poster">
                          {r.points}
                          <span className="ml-1 font-sans text-xs font-medium text-ink-400">pt{r.points > 1 ? "s" : ""}</span>
                        </td>
                      </tr>
                    ))}
                    {scale.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-5 py-4 text-sm text-ink-600">
                          Le barème de la saison sera affiché ici dès sa publication.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-ink-400">
                Les points sont garantis pour tout joueur atteignant au minimum le top 64. Le barème est fixe pour toute la
                durée de la saison en cours, mais pourra être ajusté entre deux saisons.
              </p>
            </Article>

            <Article id="finale" index={3} title="Qualification et finale">
              <p>
                À l&apos;issue du dernier tournoi de la saison, les <strong>{qualifiedCount} premiers joueurs</strong> du classement
                général se qualifient pour la grande finale.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>La ligne de qualification est visible en rouge sur la page « Classement » du site tout au long de l&apos;année.</li>
                <li>
                  En cas de désistement d&apos;un joueur qualifié, la place est automatiquement réattribuée au joueur suivant dans
                  le classement ({qualifiedCount + 1}e, puis {qualifiedCount + 2}e, etc.).
                </li>
              </ul>
              <Callout tone="gold">
                <strong>Le bonus du podium :</strong> les 3 premiers joueurs du classement général de la ligue se voient offrir
                leur place (inscription gratuite) pour la finale.
              </Callout>
            </Article>

            <Article id="resultats" index={4} title="Résultats et comptes joueurs">
              <p>
                Les résultats officiels de la ligue sont basés sur l&apos;application officielle Bandai TCG+ utilisée lors de nos
                tournois. Pour participer au classement, chaque joueur doit créer son compte sur le site M8T et y renseigner son
                numéro de membre Bandai. L&apos;historique complet de la ligue (placements, points cumulés, decks joués et taux de
                victoire) est alors automatiquement rattaché à votre profil joueur.
              </p>
              <Callout tone="brand">
                <strong>Avant de jouer :</strong> ajoutez votre decklist sur Bandai TCG+ <strong>avant de vous inscrire au tournoi</strong>
                , pour que nous puissions récupérer vos données, et vérifiez que votre pseudo est correct.
              </Callout>
            </Article>

            <Article id="inscriptions" index={5} title="Inscriptions, retards et remboursements">
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Les tournois sont limités à <strong>64 joueurs</strong>.
                </li>
                <li>
                  <strong>Liste d&apos;attente :</strong> tournoi complet ? Envoyez un message privé au compte Instagram{" "}
                  <a href="https://www.instagram.com/mister8tournament" target="_blank" rel="noopener noreferrer" className="font-semibold text-poster underline underline-offset-4">
                    Mister 8 Tournament
                  </a>{" "}
                  pour rejoindre la liste d&apos;attente.
                </li>
                <li>
                  <strong>Retards :</strong> au-delà de <strong>14 h 15</strong>, les places des joueurs absents sont réattribuées à la
                  liste d&apos;attente.
                </li>
                <li>
                  <strong>Remboursements :</strong> possibles jusqu&apos;à la veille du tournoi. Le jour du tournoi, aucun
                  remboursement, y compris en cas d&apos;absence sans prévenir.
                </li>
              </ul>
            </Article>

            <Article id="donnees" index={6} title="Données personnelles">
              <p>
                En participant à un tournoi Mister 8, vous acceptez que votre pseudo et vos résultats (placement, points, leader et
                decklist déclarés) soient publiés sur le site de la ligue. Votre e-mail et votre numéro de membre Bandai ne sont
                jamais rendus publics. Vous pouvez demander à tout moment le retrait ou l&apos;anonymisation de vos données. Les
                détails sont dans notre{" "}
                <Link href="/confidentialite" className="font-semibold text-poster underline underline-offset-4">
                  politique de confidentialité
                </Link>
                .
              </p>
            </Article>
          </article>
        </div>

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-ink/12 pt-6 text-sm text-ink-400">
          <p>Mister 8 Tournament League, Courbevoie.</p>
          <Link href="/calendrier" className="font-semibold text-poster underline underline-offset-4">
            Trouver mon prochain tournoi
          </Link>
        </footer>
      </div>
    </div>
  );
}
