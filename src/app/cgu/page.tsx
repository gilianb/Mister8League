import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description:
    "Les conditions générales d'utilisation du site de la Ligue Mister 8 Tournament : compte joueur, inscriptions, paiement, remboursements et fair-play.",
};

const sections = [
  {
    title: "Objet et acceptation",
    body: (
      <>
        Les présentes conditions générales d&apos;utilisation (CGU) encadrent
        l&apos;accès et l&apos;usage du site de la Ligue Mister 8 Tournament
        (M8T), édité par Mister 8 TCG, organisateur de tournois de jeux de
        cartes à collectionner à Courbevoie. En créant un compte ou en vous
        inscrivant à un tournoi, vous acceptez ces CGU ainsi que le{" "}
        <Link href="/reglement" className="font-semibold text-poster underline underline-offset-4">
          règlement de la ligue
        </Link>
        , qui les complète pour tout ce qui concerne le déroulement sportif
        (barème de points, qualification, finale).
      </>
    ),
  },
  {
    title: "Compte joueur",
    body: (
      <>
        Le compte joueur est <strong className="text-ink">personnel</strong> :
        un seul compte par joueur, créé avec une adresse e-mail valide et un
        pseudo qui vous identifie sur les classements publics. Vous êtes
        responsable de la confidentialité de vos identifiants et des actions
        réalisées depuis votre compte. Les joueurs mineurs doivent avoir
        l&apos;accord d&apos;un parent ou tuteur pour créer un compte et
        participer aux tournois.
      </>
    ),
  },
  {
    title: "Inscriptions et paiement",
    body: (
      <>
        L&apos;inscription à un tournoi se fait en ligne, dans la limite des
        places disponibles. Le paiement est traité par notre prestataire
        sécurisé <strong className="text-ink">Mollie</strong> : vos données
        bancaires ne transitent jamais par nos serveurs et n&apos;y sont
        jamais conservées. Une fois le paiement confirmé, vous recevez par
        e-mail votre billet PDF avec QR code. Le billet est{" "}
        <strong className="text-ink">nominatif</strong> et sera contrôlé à
        l&apos;entrée du tournoi.
      </>
    ),
  },
  {
    title: "Annulation et remboursement",
    body: (
      <>
        Conformément au règlement de la ligue, le remboursement d&apos;une
        inscription est possible <strong className="text-ink">jusqu&apos;à la
        veille du tournoi</strong>, sur simple demande. Le jour du tournoi,
        aucun remboursement n&apos;est effectué, y compris en cas
        d&apos;absence sans prévenir. Si un tournoi est annulé ou reporté par
        l&apos;organisateur, les joueurs inscrits sont prévenus et
        intégralement remboursés, ou leur inscription est reportée sur la
        nouvelle date avec leur accord.
      </>
    ),
  },
  {
    title: "Fair-play et comportement",
    body: (
      <>
        Les tournois Mister 8 sont des événements conviviaux : le respect des
        autres joueurs, du staff et du matériel est exigé. La triche, sous
        toutes ses formes, ainsi que tout comportement antisportif ou
        irrespectueux peuvent entraîner un avertissement, une disqualification
        du tournoi, voire une exclusion de la ligue, à l&apos;appréciation de
        l&apos;organisation et dans les conditions prévues par le règlement.
      </>
    ),
  },
  {
    title: "Résultats et données personnelles",
    body: (
      <>
        En participant à un tournoi de la ligue, vous acceptez la publication
        de votre pseudo et de vos résultats (placement, points, leader joué,
        decklist déclarée) sur les pages publiques du site. Le traitement de
        vos données personnelles est détaillé dans notre{" "}
        <Link href="/confidentialite" className="font-semibold text-poster underline underline-offset-4">
          politique de confidentialité
        </Link>
        , conforme au RGPD, qui précise également comment exercer vos droits.
      </>
    ),
  },
  {
    title: "Propriété intellectuelle",
    body: (
      <>
        Le nom, le logo et les visuels Mister 8 TCG sont la propriété de
        l&apos;organisateur et ne peuvent être réutilisés sans autorisation.
        One Piece Card Game est une marque de Bandai : la Ligue Mister 8
        Tournament est un circuit indépendant, non affilié à Bandai ni à ses
        ayants droit.
      </>
    ),
  },
  {
    title: "Disponibilité du site et responsabilité",
    body: (
      <>
        Nous faisons notre possible pour que le site soit accessible en
        permanence, sans pouvoir le garantir (maintenance, incident
        technique). Les informations affichées — dates, horaires, formats,
        classements — peuvent être corrigées ou mises à jour à tout moment ;
        en cas de changement important sur un tournoi, les joueurs inscrits
        sont prévenus par e-mail.
      </>
    ),
  },
  {
    title: "Modification des CGU et droit applicable",
    body: (
      <>
        Ces CGU peuvent évoluer avec la ligue ; la version en ligne fait foi.
        Elles sont soumises au droit français. Pour toute question, écrivez à{" "}
        <a href="mailto:as@mister-8.com" className="font-semibold text-poster underline underline-offset-4">
          as@mister-8.com
        </a>{" "}
        ou par message privé au compte Instagram{" "}
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
];

export default function CguPage() {
  return (
    <div className="bg-paper text-ink">
      <div className="page-shell py-14 sm:py-20">
        <header className="max-w-3xl">
          <p className="kicker text-poster">Mister 8 Tournament League</p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-6xl">
            Conditions générales d&apos;utilisation.
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-ink-600">
            Les règles d&apos;usage du site et des inscriptions : compte joueur, paiement, remboursements et fair-play.
          </p>
        </header>

        <div className="mt-14 grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-20">
          <aside>
            <div className="lg:sticky lg:top-28">
              <p className="text-sm font-semibold text-ink">Sommaire</p>
              <nav aria-label="Sommaire des conditions générales d'utilisation">
                <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/12">
                  {sections.map((section, index) => (
                    <li key={section.title}>
                      <a href={`#cgu-${index + 1}`} className="block py-3 text-sm text-ink-600 transition-colors hover:text-poster">
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
              <section id={`cgu-${index + 1}`} key={s.title} className="scroll-mt-28 border-t border-ink/12 py-10 first:border-t-0 first:pt-0">
                <h2 className="font-display text-[1.75rem] font-semibold tracking-[-0.015em] text-ink">{s.title}</h2>
                <p className="mt-4 text-[15px] leading-7 text-ink-600">{s.body}</p>
              </section>
            ))}
          </article>
        </div>

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-ink/12 pt-6 text-sm text-ink-400">
          <p>Mister 8 Tournament League, Courbevoie.</p>
          <Link href="/confidentialite" className="font-semibold text-poster underline underline-offset-4">
            Lire la politique de confidentialité
          </Link>
        </footer>
      </div>
    </div>
  );
}
