import type { Metadata } from "next";
import Link from "next/link";
import HatLogo from "@/components/HatLogo";

export const metadata: Metadata = {
  title: "Connexion",
};

export default function ConnexionPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <HatLogo className="w-16 mx-auto mb-6" />
      <h1 className="font-display text-3xl font-bold text-cream-100 mb-3">
        Bientôt disponible
      </h1>
      <p className="text-cream-400 mb-8">
        La création de compte joueur (e-mail ou Google) arrive avec la mise en
        ligne de la ligue. En attendant, découvrez à quoi ressemblera votre
        espace joueur.
      </p>
      <Link
        href="/joueur"
        className="inline-block rounded-lg bg-gold-400 px-5 py-3 font-semibold text-coal-950 hover:bg-gold-300 transition-colors"
      >
        Voir l&apos;espace joueur (démo)
      </Link>
    </div>
  );
}
