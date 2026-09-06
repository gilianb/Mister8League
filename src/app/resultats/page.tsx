import type { Metadata } from "next";
import Link from "next/link";
import PageBackdrop from "@/components/PageBackdrop";
import { EmptyState } from "@/components/ui/EmptyState";
import { listCompletedEvents } from "@/lib/db/events";
import { formatDateShort } from "@/lib/format";

export const metadata: Metadata = {
  title: "Résultats de nos tournois",
  description: "Les classements finaux, leaders joués et points de ligue des tournois de la Mister 8 Tournament League.",
};
export const dynamic = "force-dynamic";

export default async function ResultatsPage() {
  const events = await listCompletedEvents();

  return (
    <div className="relative">
      <PageBackdrop src="/ambiance/bg-resultats.jpg" position="50% 20%" />
      <div className="relative mx-auto max-w-4xl px-4 py-12">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream-100 mb-2">Résultats de nos tournois</h1>
        <p className="text-cream-400 mb-8 max-w-[60ch]">
          Pour chaque tournoi terminé : classement final, leaders joués et points de ligue attribués.
        </p>

        {events.length > 0 ? (
          <div className="grid gap-4">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/resultats/${e.slug}`}
                className="rounded-xl border hairline bg-coal-800 p-5 flex flex-wrap items-center gap-x-6 gap-y-2 hover:border-gold-400/50 transition-colors"
              >
                <div className="flex-1 min-w-52">
                  <p className="text-[10px] tracking-[0.2em] text-cream-600 font-semibold">
                    {formatDateShort(e.starts_at).toUpperCase()}
                    {e.format_label && ` · ${e.format_label}`}
                  </p>
                  <h2 className="font-display text-lg font-bold text-cream-100 mt-0.5">{e.title}</h2>
                </div>
                <span className="text-sm text-gold-400 font-medium">Voir le classement →</span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aucun résultat publié pour l'instant"
            text="Les résultats du premier tournoi de la saison apparaîtront ici juste après l'événement."
          />
        )}
      </div>
    </div>
  );
}
