import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import HatLogo from "@/components/HatLogo";

export const metadata: Metadata = { title: "Page introuvable", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="page-shell flex min-h-[60vh] max-w-2xl flex-col justify-center py-20">
      <HatLogo className="mb-8 w-20" />
      <p className="kicker">Erreur 404</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.025em] text-cream-100 sm:text-5xl">Cette page n&apos;est pas à la table.</h1>
      <p className="mt-5 max-w-[50ch] text-base leading-relaxed text-cream-400">
        Le lien est peut-être périmé, ou le tournoi a changé d&apos;adresse. Retrouvez le calendrier et le classement depuis
        l&apos;accueil.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="/">Retour à l&apos;accueil</Button>
        <Button href="/calendrier" variant="outline">
          Voir les tournois
        </Button>
      </div>
    </div>
  );
}
