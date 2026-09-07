import type { Metadata } from "next";
import Link from "next/link";

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
          className="font-semibold text-poster underline underline-offset-4"
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
    <div className="bg-paper text-ink">
      <div className="page-shell py-14 sm:py-20">
        <header className="max-w-3xl">
          <p className="kicker text-poster">Mister 8 Tournament League</p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-6xl">Vos données, en clair.</h1>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-ink-600">
            Ce que la ligue enregistre, pourquoi, ce qui est public et les droits que vous gardez.
          </p>
        </header>

        <div className="mt-14 grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20">
          <aside>
            <div className="lg:sticky lg:top-28">
              <p className="text-sm font-semibold text-ink">Sommaire</p>
              <nav aria-label="Sommaire de la politique de confidentialité">
                <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/12">
                  {sections.map((section, index) => (
                    <li key={section.title}>
                      <a href={`#confidentialite-${index + 1}`} className="block py-3 text-sm text-ink-600 transition-colors hover:text-poster">
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="mt-8 border-l-4 border-poster pl-4">
                <p className="font-display text-xl font-semibold tracking-tight text-ink">Une question ?</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-600">L&apos;équipe Mister 8 vous répond par message privé sur Instagram.</p>
                <a
                  href="https://www.instagram.com/mister8tournament"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-semibold text-poster underline underline-offset-4"
                >
                  Écrire à Mister 8 Tournament
                </a>
              </div>
            </div>
          </aside>

          <article className="max-w-3xl">
            {sections.map((s, index) => (
              <section id={`confidentialite-${index + 1}`} key={s.title} className="scroll-mt-28 border-t border-ink/12 py-10 first:border-t-0 first:pt-0">
                <h2 className="font-display text-[1.75rem] font-semibold tracking-[-0.015em] text-ink">{s.title}</h2>
                <p className="mt-4 text-[15px] leading-7 text-ink-600">{s.body}</p>
              </section>
            ))}
          </article>
        </div>

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-ink/12 pt-6 text-sm text-ink-400">
          <p>Mister 8 Tournament League, Courbevoie.</p>
          <Link href="/reglement" className="font-semibold text-poster underline underline-offset-4">
            Consulter le règlement
          </Link>
        </footer>
      </div>
    </div>
  );
}
