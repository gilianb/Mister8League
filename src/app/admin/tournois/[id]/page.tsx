import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/db/events";
import { listSeasons } from "@/lib/db/seasons";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import EventForm from "@/components/admin/EventForm";
import EventStatusControls from "@/components/admin/EventStatusControls";

export const metadata: Metadata = { title: "Modifier le tournoi · Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, BadgeTone> = { draft: "neutral", published: "good", cancelled: "bad", completed: "gold" };
const STATUS_LABEL: Record<string, string> = { draft: "Brouillon", published: "Publié", cancelled: "Annulé", completed: "Terminé" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> };

export default async function AdminTournoiPage({ params, searchParams }: Props) {
  const [{ id }, { msg }] = await Promise.all([params, searchParams]);
  const [event, seasons] = await Promise.all([getEventById(id), listSeasons()]);
  if (!event) notFound();

  return (
    <div>
      <PageHeader
        backHref="/admin/tournois"
        backLabel="Tous les tournois"
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <Badge tone={STATUS_TONE[event.status]}>{STATUS_LABEL[event.status]}</Badge>
            <span>
              {event.seats.paid_count}
              {event.capacity > 0 ? ` / ${event.capacity}` : ""} inscrits
            </span>
          </span>
        }
        title={event.title}
        actions={
          <>
            <Button href={`/tournois/${event.slug}`} variant="ghost" size="sm">
              Voir la fiche publique
            </Button>
            <Button href={`/admin/tournois/${event.id}/participants`} variant="outline" size="sm">
              Participants
            </Button>
            <Button href={`/admin/tournois/${event.id}/resultats`} variant="outline" size="sm">
              Résultats
            </Button>
            <Button href={`/admin/tournois/nouveau?depuis=${event.id}`} variant="ghost" size="sm">
              Dupliquer
            </Button>
          </>
        }
      />
      {msg === "cree" && <Alert tone="success" className="mb-5">Tournoi créé en brouillon. Vérifiez la fiche puis publiez-la.</Alert>}
      <div className="mb-5 flex justify-end">
        <EventStatusControls eventId={event.id} status={event.status} />
      </div>
      <EventForm mode="edit" event={event} seasons={seasons} templates={[]} />
    </div>
  );
}
