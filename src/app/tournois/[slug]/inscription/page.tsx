import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getEventBySlug } from "@/lib/db/events";
import { getMyActiveRegistration } from "@/lib/db/registrations";
import { listMyDecks } from "@/lib/db/decks";
import { listLeaders, toLeaderOptions } from "@/lib/db/leaders";
import { getSessionWithProfile, isProfileComplete } from "@/lib/auth/session";
import { eventAvailability, seatsLeft } from "@/lib/tournaments/status";
import { PageHeader } from "@/components/ui/PageHeader";
import RegisterForm from "./RegisterForm";
import { currentTimeMs } from "@/lib/clock";

export const metadata: Metadata = { title: "Inscription au tournoi", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function InscriptionPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const back = `/tournois/${event.slug}`;
  const { user, profile } = await getSessionWithProfile();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(`/tournois/${event.slug}/inscription`)}`);
  if (!isProfileComplete(profile)) {
    redirect(`/joueur/profil?next=${encodeURIComponent(`/tournois/${event.slug}/inscription`)}&raison=inscription`);
  }

  const mine = await getMyActiveRegistration(event.id);
  if (mine) redirect(mine.status === "pending_payment" ? back : `/tournois/inscription/${mine.id}`);

  const availability = eventAvailability(event, currentTimeMs());
  if (!availability.open) redirect(back);
  if (seatsLeft(event.capacity, event.seats.active_count) === 0) redirect(back);

  const [decks, leaders] = await Promise.all([listMyDecks(), listLeaders()]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader
        backHref={back}
        backLabel="Retour au tournoi"
        eyebrow="Inscription"
        title={event.title}
        lede="Votre place est réservée pendant 15 minutes, le temps de régler en ligne. Le billet PDF arrive ensuite par e-mail."
      />
      <RegisterForm
        event={{
          id: event.id,
          slug: event.slug,
          title: event.title,
          price_cents: event.price_cents,
          fee_bps: event.fee_bps,
          currency: event.currency,
        }}
        profile={{
          fullName: profile!.full_name ?? "",
          email: user.email ?? "",
          phone: profile!.phone ?? "",
        }}
        decks={decks.map((d) => ({ id: d.id, name: d.name, leaderId: d.leader_id, leaderName: d.leader?.name ?? null }))}
        leaders={toLeaderOptions(leaders)}
      />
    </div>
  );
}
