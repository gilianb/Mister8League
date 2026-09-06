import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Countdown from "@/components/Countdown";
import PayNowButton from "@/components/PayNowButton";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconCalendar, IconPin, IconTicket } from "@/components/ui/icons";
import { getEventBySlug } from "@/lib/db/events";
import { getMyActiveRegistration } from "@/lib/db/registrations";
import { getSessionWithProfile, isProfileComplete } from "@/lib/auth/session";
import { formatDateLong, formatTime, plural } from "@/lib/format";
import { formatEuros } from "@/lib/money";
import { computeTotals } from "@/lib/payments/amounts";
import { availabilityLabel, eventAvailability, isPaidStatus, seatsLeft } from "@/lib/tournaments/status";
import { TOURNAMENT_CONTACT_EMAIL, tournamentMailto } from "@/lib/email/senders";
import { currentTimeMs } from "@/lib/clock";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ msg?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};
  return { title: event.title, description: event.subtitle ?? `${formatDateLong(event.starts_at)} à ${event.city}. Inscription en ligne.` };
}

function TextBlock({ title, text }: { title: string; text: string | null }) {
  if (!text) return null;
  return (
    <section className="rounded-2xl border hairline bg-coal-800 p-5 sm:p-6">
      <h2 className="text-[11px] tracking-[0.2em] text-gold-400 font-semibold mb-3 uppercase">{title}</h2>
      <div className="text-sm text-cream-300 whitespace-pre-wrap leading-relaxed">{text}</div>
    </section>
  );
}

export default async function TournoiPage({ params, searchParams }: Props) {
  const [{ slug }, { msg }] = await Promise.all([params, searchParams]);
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const { user, profile } = await getSessionWithProfile();
  const mine = user ? await getMyActiveRegistration(event.id) : null;
  const nowMs = currentTimeMs();
  const availability = eventAvailability(event, nowMs);
  const left = seatsLeft(event.capacity, event.seats.active_count);
  const totals = computeTotals(event.price_cents, event.fee_bps);
  const minePaid = !!mine && isPaidStatus(mine.status);
  const minePending = !!mine && mine.status === "pending_payment";

  const banner =
    msg === "annulee"
      ? { tone: "info" as const, text: "Votre réservation a été annulée. Vous pouvez vous réinscrire tant qu'il reste des places." }
      : msg === "auth"
        ? { tone: "warn" as const, text: "Connectez-vous pour vous inscrire." }
        : null;

  let cta: React.ReactNode;
  if (event.status === "completed") {
    cta = (
      <Button href={`/resultats/${event.slug}`} size="lg">
        Voir les résultats
      </Button>
    );
  } else if (minePaid) {
    cta = (
      <Button href={`/tournois/inscription/${mine!.id}`} size="lg">
        <IconTicket size={18} /> Mon billet
      </Button>
    );
  } else if (minePending) {
    cta = <PayNowButton registrationId={mine!.id} size="lg" />;
  } else if (!availability.open) {
    cta = <Badge tone="neutral">{availabilityLabel(availability.reason)}</Badge>;
  } else if (left === 0) {
    cta = <Badge tone="bad">Complet</Badge>;
  } else if (!user) {
    cta = (
      <Button href={`/connexion?next=${encodeURIComponent(`/tournois/${event.slug}/inscription`)}`} size="lg">
        Se connecter pour s&apos;inscrire
      </Button>
    );
  } else if (!isProfileComplete(profile)) {
    cta = (
      <Button href={`/joueur/profil?next=${encodeURIComponent(`/tournois/${event.slug}/inscription`)}&raison=inscription`} size="lg">
        Compléter mon profil pour m&apos;inscrire
      </Button>
    );
  } else {
    cta = (
      <Button href={`/tournois/${event.slug}/inscription`} size="lg" variant="brand">
        S&apos;inscrire · {formatEuros(totals.totalCents)}
      </Button>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/calendrier" className="text-sm text-cream-600 hover:text-gold-400">
        ← Calendrier des tournois
      </Link>

      {banner && (
        <Alert tone={banner.tone} className="mt-4">
          {banner.text}
        </Alert>
      )}

      {/* Affiche */}
      <section className="mt-6 bg-paper text-ink poster-frame p-6 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-[10px] tracking-[0.28em] text-poster font-extrabold">
            ONE PIECE CARD GAME{event.counts_for_league ? " · COMPTE POUR LA LIGUE" : " · HORS LIGUE"}
          </p>
          {event.format_label && <span className="text-[10px] font-bold tracking-wider px-2 py-1 bg-ink text-gold-400">{event.format_label}</span>}
        </div>
        <h1 className="font-poster text-3xl sm:text-5xl mt-4 leading-tight text-balance">{event.title}</h1>
        {event.subtitle && <p className="mt-3 text-ink-600 max-w-[60ch]">{event.subtitle}</p>}
        <p className="text-gold-600 tracking-[0.5em] my-5" aria-hidden="true">
          ✦ ✦ ✦
        </p>
        <div className="grid sm:grid-cols-3 gap-5 text-sm">
          <div className="flex gap-3">
            <IconCalendar className="text-poster shrink-0" />
            <div>
              <p className="font-bold">{formatDateLong(event.starts_at)}</p>
              <p className="text-ink-600">Ouverture des portes {formatTime(event.starts_at)}</p>
              <p className="text-ink-400 text-xs mt-1">Arrivez 30 min avant pour l&apos;enregistrement Bandai.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <IconPin className="text-poster shrink-0" />
            <div>
              <p className="font-bold">{event.venue_name ?? "Mister 8 TCG"}</p>
              <p className="text-ink-600 whitespace-pre-line">{event.venue_address ?? event.city}</p>
              {event.google_maps_url && (
                <a href={event.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-poster underline">
                  Ouvrir dans Google Maps
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <IconTicket className="text-poster shrink-0" />
            <div>
              <p className="font-bold">
                {formatEuros(event.price_cents)}
                {totals.feeCents > 0 && <span className="text-ink-400 font-normal"> + {formatEuros(totals.feeCents)} de frais</span>}
              </p>
              <p className="text-ink-600">
                {event.capacity > 0
                  ? left === 0
                    ? "Complet"
                    : `${left} ${plural(left, "place")} ${plural(left, "restante")} sur ${event.capacity}`
                  : "Places illimitées"}
              </p>
              {event.rounds && <p className="text-ink-400 text-xs mt-1">{event.rounds} rondes suisses</p>}
            </div>
          </div>
        </div>
        {event.capacity > 0 && (
          <div className="mt-5 h-2 w-full bg-ink/10 overflow-hidden">
            <div className="h-full bg-poster" style={{ width: `${Math.min(100, Math.round((event.seats.active_count / event.capacity) * 100))}%` }} />
          </div>
        )}
        <div className="mt-7 flex flex-wrap items-center gap-4">
          {cta}
          {minePaid && <Badge tone="good">Vous êtes inscrit</Badge>}
          {minePending && <Badge tone="warn">Place réservée · paiement en attente</Badge>}
          {event.status === "cancelled" && <Badge tone="bad">Tournoi annulé</Badge>}
        </div>
        {minePending && (
          <p className="mt-3 text-xs text-ink-600">
            Votre place est réservée quelques minutes le temps du paiement. Sans paiement, elle est libérée automatiquement.
          </p>
        )}
      </section>

      {event.status === "published" && availability.reason !== "past" && (
        <div className="mt-6 max-w-md">
          <Countdown targetIso={event.starts_at} />
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <TextBlock title="Description" text={event.description} />
        <TextBlock title="Déroulé" text={event.schedule_text} />
        <TextBlock title="Règles du tournoi" text={event.rules_text} />
        <TextBlock title="Dotation" text={event.prizes_text} />
        <section className="rounded-2xl border hairline bg-coal-800 p-5 sm:p-6 md:col-span-2">
          <h2 className="text-[11px] tracking-[0.2em] text-gold-400 font-semibold mb-2 uppercase">Une question ?</h2>
          <p className="text-sm text-cream-300">
            Écrivez à{" "}
            <a href={tournamentMailto(event.title)} className="text-gold-400 underline underline-offset-4">
              {TOURNAMENT_CONTACT_EMAIL}
            </a>{" "}
            (tournois uniquement : inscription, paiement, billet, check-in). Le{" "}
            <Link href="/reglement" className="underline underline-offset-4">
              règlement de la ligue
            </Link>{" "}
            précise les conditions de remboursement.
          </p>
        </section>
      </div>
    </div>
  );
}
