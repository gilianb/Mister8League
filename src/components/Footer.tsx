import Link from "next/link";
import HatLogo from "./HatLogo";

export default function Footer() {
  return (
    <footer className="border-t hairline bg-coal-950 mt-16">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <HatLogo className="w-7" />
            <span className="font-display font-bold text-cream-100">MISTER 8 TCG</span>
          </div>
          <p className="text-sm text-cream-600 max-w-[30ch]">
            Organisateur de tournois de jeux de cartes à collectionner à Courbevoie.
          </p>
        </div>
        <div className="text-sm">
          <p className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold mb-3">LA LIGUE</p>
          <ul className="space-y-2 text-cream-400">
            <li><Link href="/calendrier" className="hover:text-gold-400">Calendrier et inscriptions</Link></li>
            <li><Link href="/classement" className="hover:text-gold-400">Classement de la saison</Link></li>
            <li><Link href="/resultats" className="hover:text-gold-400">Résultats des tournois</Link></li>
            <li><Link href="/joueur" className="hover:text-gold-400">Mon espace joueur</Link></li>
            <li><Link href="/reglement" className="hover:text-gold-400">Règlement</Link></li>
            <li><Link href="/confidentialite" className="hover:text-gold-400">Politique de confidentialité</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="text-[11px] tracking-[0.2em] text-cream-600 font-semibold mb-3">NOUS SUIVRE</p>
          <ul className="space-y-2 text-cream-400">
            <li>
              <a href="https://www.instagram.com/mister8tournament" target="_blank" rel="noopener noreferrer" className="hover:text-gold-400">
                Instagram : @mister8tournament
              </a>
            </li>
            <li>
              <a href="https://mister-8.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold-400">
                Boutique : mister-8.com
              </a>
            </li>
            <li>
              <a href="mailto:as@mister-8.com" className="hover:text-gold-400">
                Questions tournois : as@mister-8.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t hairline">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-cream-600">
          © {new Date().getFullYear()} Mister 8 TCG, Courbevoie. One Piece Card Game est une marque de Bandai.
        </p>
      </div>
    </footer>
  );
}
