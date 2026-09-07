import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconChevronRight } from "@/components/ui/icons";
import { listCompletedEvents } from "@/lib/db/events";
import { formatDateShort } from "@/lib/format";

export const metadata: Metadata = {
  title: "Résultats des tournois",
  description: "Les classements finaux, leaders joués et points de ligue des tournois de la Mister 8 Tournament League.",
};
export const dynamic = "force-dynamic";

export default async function ResultatsPage() {
  const events = await listCompletedEvents();

  return (
    <div className="page-shell py-12 sm:py-16">
      <PageHeader title="Résultats des tournois." lede="Pour chaque tournoi terminé : le classement final, les leaders joués et les points de ligue attribués." />

      {events.length > 0 ? (
        <ul className="divide-y divide-hairline border-y hairline">
          {events.map((e) => (
            <li key={e.id}>
              <Link
                href={`/resultats/${e.slug}`}
                className="group flex flex-wrap items-center gap-x-8 gap-y-2 py-6 transition-colors hover:bg-coal-800/60 sm:px-3"
              >
                <time dateTime={e.starts_at} className="tabular w-44 shrink-0 text-sm text-cream-500">
                  {formatDateShort(e.starts_at)}
                </time>
                <span className="min-w-48 flex-1">
                  <span className="block font-display text-2xl font-medium tracking-tight text-cream-100 transition-colors group-hover:text-gold-300">
                    {e.title}
                  </span>
                  {e.format_label && <span className="mt-1 block text-xs text-cream-500">{e.format_label}</span>}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-gold-400">
                  Voir le classement <IconChevronRight size={16} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Aucun résultat publié pour l'instant" text="Les résultats du premier tournoi de la saison apparaîtront ici juste après l'événement." />
      )}
    </div>
  );
}
