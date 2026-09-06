import type { Metadata } from "next";
import { listSeasons } from "@/lib/db/seasons";
import { listAllEvents } from "@/lib/db/events";
import { PageHeader } from "@/components/ui/PageHeader";
import EventForm from "@/components/admin/EventForm";

export const metadata: Metadata = { title: "Nouveau tournoi · Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ depuis?: string }> };

export default async function NouveauTournoiPage({ searchParams }: Props) {
  const { depuis } = await searchParams;
  const [seasons, events] = await Promise.all([listSeasons(), listAllEvents()]);
  return (
    <div>
      <PageHeader backHref="/admin/tournois" backLabel="Tous les tournois" title="Nouveau tournoi" lede="Le tournoi reste en brouillon (invisible) jusqu'à ce que vous le publiiez." />
      <EventForm mode="create" event={null} seasons={seasons} templates={events} initialTemplateId={depuis} />
    </div>
  );
}
