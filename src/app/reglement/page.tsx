import type { Metadata } from "next";
import { getActiveSeason } from "@/lib/data";
import { DEFAULT_SCALE } from "@/lib/bandai-csv";

export const metadata: Metadata = {
  title: "Règlement de la ligue",
  description:
    "Le règlement officiel de la Ligue Mister 8 Tournament (M8T) : barème de points, qualification pour la finale et comptes joueurs.",
};

export default async function ReglementPage() {
  const season = await getActiveSeason();

  return (
    <div className="bg-paper text-ink py-14 px-4 min-h-full">
      <div className="mx-auto max-w-3xl poster-frame bg-paper-50 px-6 sm:px-12 py-12">
        <p className="text-center text-[10px] tracking-[0.3em] text-poster font-extrabold mb-3">
          MISTER 8 TCG · SAISON 1 · 2026/2027
        </p>
        <h1 className="font-poster text-3xl sm:text-4xl text-center leading-tight text-balance">
          Règlement de la Ligue Mister 8 Tournament
        </h1>
        <p className="text-center text-xs tracking-[0.2em] text-ink-400 font-semibold mt-2">
          « M8T »
        </p>
        <p className="text-center text-gold-600 tracking-[0.5em] my-5" aria-hidden="true">
          ✦ ✦ ✦
        </p>

        <section className="mt-8">
          <h2 className="font-poster text-poster text-xl mb-3">1. La saison</h2>
          <p className="text-sm leading-relaxed text-ink-600">
            La {season.name}{" "}
            regroupe l&apos;ensemble des tournois One Piece
            Card Game officiellement organisés par Mister 8 TCG. Chaque
            tournoi joué rapporte des points de ligue selon votre classement
            final. Ces points s&apos;additionnent tout au long de la saison
            pour former le classement général.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-600">
            <strong className="text-ink">Départage :</strong>{" "}
            en cas
            d&apos;égalité de points au classement général, le meilleur
            placement individuel obtenu lors d&apos;un tournoi sur la saison
            sert de critère de départage.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-ink-400 border-l-2 border-rift-600 pl-3">
            Note : les tournois « Riftbound » organisés par Mister 8 sont des
            événements hors ligue et ne rapportent aucun point pour le moment.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-poster text-poster text-xl mb-4">
            2. Barème des points de ligue
          </h2>
          <table className="w-full text-sm border-2 border-ink">
            <thead>
              <tr className="bg-ink text-gold-400 text-left">
                <th className="px-4 py-2.5 font-bold tracking-wider">PLACEMENT</th>
                <th className="px-4 py-2.5 font-bold tracking-wider text-right">POINTS DE LIGUE</th>
              </tr>
            </thead>
            <tbody>
              {DEFAULT_SCALE.map((r) => (
                <tr key={r.label} className="border-t border-ink/25 odd:bg-paper">
                  <td className="px-4 py-2.5 font-semibold">{r.label}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-poster tabular">
                    {r.points} pt{r.points > 1 ? "s" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-ink-400">
            Les points sont garantis pour tout joueur atteignant au minimum le
            Top 64. Le barème est fixe pour toute la durée de la saison en
            cours, mais pourra être ajusté entre deux saisons.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-poster text-poster text-xl mb-3">
            3. Qualification et Main Event
          </h2>
          <p className="text-sm leading-relaxed text-ink-600">
            À l&apos;issue du dernier tournoi de la saison, les{" "}
            <strong className="text-ink">
              {season.qualifiedCount} premiers joueurs
            </strong>{" "}
            du classement général se qualifient pour la grande Finale.
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-600 list-disc pl-5">
            <li>
              La ligne de qualification est visible en rouge sur la page
              « Classement » du site tout au long de l&apos;année.
            </li>
            <li>
              En cas de désistement d&apos;un joueur qualifié, la place est
              automatiquement réattribuée au joueur suivant dans le classement
              (17ème, etc.).
            </li>
          </ul>
          <div className="mt-4 border-2 border-gold-600 bg-paper px-4 py-3">
            <p className="text-sm leading-relaxed text-ink-600">
              <strong className="text-ink">🎁 Bonus :</strong> les 3 premiers
              joueurs du classement général de la ligue se verront offrir leur
              place (inscription gratuite) pour le Main Event.
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-poster text-poster text-xl mb-3">
            4. Résultats &amp; comptes joueurs
          </h2>
          <p className="text-sm leading-relaxed text-ink-600">
            Les résultats officiels de la ligue sont basés sur
            l&apos;application officielle Bandai TCG+ utilisée lors de nos
            tournois. Pour participer au classement, chaque joueur doit créer
            son compte sur le site M8T et y renseigner son numéro de membre
            Bandai. Ainsi, l&apos;historique complet de la ligue (placements,
            points cumulés, decks joués et winrate) sera automatiquement
            synchronisé et rattaché à votre profil joueur.
          </p>
          <div className="mt-4 border-2 border-poster bg-paper px-4 py-3">
            <p className="text-sm leading-relaxed text-ink-600">
              <strong className="text-ink">⚠️ Important :</strong>{" "}
              ajoutez bien votre decklist sur Bandai TCG+{" "}
              <strong className="text-ink">avant de vous inscrire au tournoi</strong>,
              pour que nous puissions récupérer vos données, et vérifiez que
              votre pseudo est correct.
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-poster text-poster text-xl mb-3">
            5. Inscriptions, retards &amp; remboursements
          </h2>
          <ul className="space-y-2 text-sm leading-relaxed text-ink-600 list-disc pl-5">
            <li>
              Les tournois sont limités à{" "}
              <strong className="text-ink">64 joueurs</strong>.
            </li>
            <li>
              <strong className="text-ink">Liste d&apos;attente :</strong>{" "}
              tournoi complet ? Envoyez un message privé au compte Instagram{" "}
              <a
                href="https://www.instagram.com/mister8tournament"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-poster underline"
              >
                Mister 8 Tournament
              </a>{" "}
              pour rejoindre la liste d&apos;attente.
            </li>
            <li>
              <strong className="text-ink">Retards :</strong> au-delà de{" "}
              <strong className="text-ink">14 h 15</strong>, les places des
              joueurs absents sont réattribuées à la liste d&apos;attente.
            </li>
            <li>
              <strong className="text-ink">Remboursements :</strong> possibles
              jusqu&apos;à la veille du tournoi. Le jour du tournoi, aucun
              remboursement, y compris en cas d&apos;absence sans prévenir.
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="font-poster text-poster text-xl mb-3">
            6. Données personnelles
          </h2>
          <p className="text-sm leading-relaxed text-ink-600">
            En participant à un tournoi Mister 8, vous acceptez que votre
            pseudo et vos résultats (placement, points, leader et decklist
            déclarés) soient publiés sur le site de la ligue. Votre e-mail et
            votre numéro de membre Bandai ne sont jamais rendus publics. Vous
            pouvez demander à tout moment le retrait ou l&apos;anonymisation
            de vos données. Détails dans notre{" "}
            <a href="/confidentialite" className="font-semibold text-poster underline">
              politique de confidentialité
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
