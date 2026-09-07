import Link from "next/link";
import HatLogo from "./HatLogo";

const LEAGUE_LINKS = [
  { href: "/calendrier", label: "Calendrier et inscriptions" },
  { href: "/classement", label: "Classement de la saison" },
  { href: "/resultats", label: "Résultats des tournois" },
  { href: "/joueur", label: "Mon espace joueur" },
  { href: "/reglement", label: "Règlement de la ligue" },
  { href: "/confidentialite", label: "Politique de confidentialité" },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t hairline bg-coal-950">
      <div className="page-shell grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:gap-8">
        <div>
          <div className="flex items-center gap-3">
            <HatLogo className="w-12" />
            <div className="leading-none">
              <p className="font-display text-xl font-semibold text-cream-100">Mister 8</p>
              <p className="mt-1 text-xs font-medium text-gold-400">Tournament League</p>
            </div>
          </div>
          <p className="mt-5 max-w-[36ch] text-sm leading-relaxed text-cream-500">
            La ligue One Piece Card Game de la boutique Mister 8 TCG, à Courbevoie. Des tournois toute la saison, une
            finale pour les meilleurs.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-cream-100">La ligue</p>
          <ul className="mt-4 space-y-2.5 text-sm text-cream-400">
            {LEAGUE_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-gold-300">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-cream-100">Nous suivre</p>
          <ul className="mt-4 space-y-2.5 text-sm text-cream-400">
            <li>
              <a href="https://www.instagram.com/mister8tournament" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-gold-300">
                Instagram @mister8tournament
              </a>
            </li>
            <li>
              <a href="https://mister-8.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-gold-300">
                La boutique mister-8.com
              </a>
            </li>
            <li>
              <a href="mailto:as@mister-8.com" className="transition-colors hover:text-gold-300">
                Questions tournois : as@mister-8.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t hairline">
        <div className="page-shell flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5 text-xs text-cream-600">
          <p>© {new Date().getFullYear()} Mister 8 TCG, Courbevoie.</p>
          <p>One Piece Card Game est une marque de Bandai.</p>
        </div>
      </div>
    </footer>
  );
}
