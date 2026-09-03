import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Quelles données la Ligue Mister 8 Tournament collecte, pourquoi, et comment demander leur suppression.",
};

const sections = [
  {
    title: "Qui sommes-nous ?",
    body: (
      <>
        Le site de la Ligue Mister 8 Tournament (M8T) est édité par Mister 8
        TCG, organisateur de tournois de jeux de cartes à collectionner à
        Courbevoie. Pour toute question sur vos données : message privé au
        compte Instagram{" "}
        <a
          href="https://www.instagram.com/mister8tournament"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-poster underline"
        >
          Mister 8 Tournament
        </a>
        .
      </>
    ),
  },
  {
    title: "Quelles données collectons-nous ?",
    body: (
      <>
        <strong className="text-ink">Votre compte</strong> : adresse e-mail et
        pseudo. <strong className="text-ink">Votre identité de joueur</strong>{" "}
        : numéro de membre Bandai, utilisé uniquement pour rattacher vos
        résultats de tournoi à votre profil.{" "}
        <strong className="text-ink">Vos résultats</strong> : placements,
        scores, points de ligue, leader et decklist si vous les déclarez.
        Des photos peuvent également être prises pendant nos événements.
      </>
    ),
  },
  {
    title: "Pourquoi ?",
    body: (
      <>
        Uniquement pour faire vivre la ligue : calculer le classement de la
        saison, publier les résultats des tournois, et vous donner accès à
        vos statistiques personnelles dans votre espace joueur.
      </>
    ),
  },
  {
    title: "Qu'est-ce qui est public ?",
    body: (
      <>
        Seuls votre <strong className="text-ink">pseudo</strong> et vos{" "}
        <strong className="text-ink">résultats</strong> (placement,
        points, leader joué, decklist déclarée) apparaissent publiquement sur
        les pages classement et résultats. Votre e-mail et votre numéro de
        membre Bandai ne sont <strong className="text-ink">jamais publiés</strong>.
        En participant à un tournoi Mister 8, vous acceptez cette publication.
      </>
    ),
  },
  {
    title: "Vos droits",
    body: (
      <>
        Conformément au RGPD, vous pouvez demander à tout moment
        l&apos;accès, la rectification ou la suppression de vos données, y
        compris le retrait de votre pseudo des classements publics (vos
        résultats sont alors anonymisés pour ne pas fausser le classement
        des autres joueurs) et le retrait d&apos;une photo où vous
        apparaissez. Il suffit d&apos;un message privé Instagram. Pour les
        joueurs de moins de 15 ans, un parent ou tuteur peut exercer ces
        droits.
      </>
    ),
  },
  {
    title: "Combien de temps ?",
    body: (
      <>
        Les données sont conservées pendant la durée de vie de la ligue. Un
        compte supprimé entraîne l&apos;anonymisation de ses données
        personnelles.
      </>
    ),
  },
];

export default function ConfidentialitePage() {
  return (
    <div className="bg-paper text-ink py-14 px-4 min-h-full">
      <div className="mx-auto max-w-3xl poster-frame bg-paper-50 px-6 sm:px-12 py-12">
        <p className="text-center text-[10px] tracking-[0.3em] text-poster font-extrabold mb-3">
          MISTER 8 TCG · TOURNAMENT LEAGUE
        </p>
        <h1 className="font-poster text-3xl sm:text-4xl text-center leading-tight">
          Politique de confidentialité
        </h1>
        <p className="text-center text-gold-600 tracking-[0.5em] my-5" aria-hidden="true">
          ✦ ✦ ✦
        </p>
        {sections.map((s) => (
          <section key={s.title} className="mt-7">
            <h2 className="font-poster text-poster text-xl mb-3">{s.title}</h2>
            <p className="text-sm leading-relaxed text-ink-600">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
