import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Countdown from "@/components/Countdown";
import PayNowButton from "@/components/PayNowButton";
import { PaperPill } from "@/components/EventCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Ticket, TicketBody, TicketStub } from "@/components/ui/Ticket";
import { IconChevronLeft, IconTicket } from "@/components/ui/icons";
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

const dayFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", timeZone: "Europe/Paris" });
const monthFormat = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" });
const weekdayFormat = new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: "Europe/Paris" });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};
  return { title: event.title, description: event.subtitle ?? `${formatDateLong(event.starts_at)} à ${event.city}. Inscription en ligne.` };
}

function TextBlock({ title, text }: { title: string; text: string | null }) {
  if (!text) return null;
  return (
    <section className="surface-panel p-6 sm:p-7">
      <h2 className="font-display text-xl font-semibold tracking-tight text-cream-100">{title}</h2>
      <div className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-cream-300">{text}</div>
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
  const date = new Date(event.starts_at);
  const fillPct = event.capacity > 0 ? Math.min(100, Math.round((event.seats.active_count / event.capacity) * 100)) : 0;

  const banner =
    msg === "annulee"
      ? { tone: "info" as const, text: "Votre réservation a été annulée. Vous pouvez vous réinscrire tant qu'il reste des places." }
      : msg === "auth"
        ? { tone: "warn" as const, text: "Connectez-vous pour vous inscrire." }
        : null;

  let cta: React.ReactNode;
  if (event.status === "completed") {
    cta = (
      <Button href={`/resultats/${event.slug}`} variant="paper" size="lg">
        Voir les résultats
      </Button>
    );
  } else if (minePaid) {
    cta = (
      <Button href={`/tournois/inscription/${mine!.id}`} variant="paper" size="lg">
        <IconTicket size={18} /> Mon billet
      </Button>
    );
  } else if (minePending) {
    cta = <PayNowButton registrationId={mine!.id} size="lg" />;
  } else if (!availability.open) {
    cta = <PaperPill>{availabilityLabel(availability.reason)}</PaperPill>;
  } else if (left === 0) {
    cta = <PaperPill tone="bad">Complet</PaperPill>;
  } else if (!user) {
    cta = (
      <Button href={`/connexion?next=${encodeURIComponent(`/tournois/${event.slug}/inscription`)}`} variant="brand" size="lg">
        Se connecter pour s&apos;inscrire
      </Button>
    );
  } else if (!isProfileComplete(profile)) {
    cta = (
      <Button href={`/joueur/profil?next=${encodeURIComponent(`/tournois/${event.slug}/inscription`)}&raison=inscription`} variant="brand" size="lg">
        Compléter mon profil pour m&apos;inscrire
      </Button>
    );
  } else {
    cta = (
      <Button href={`/tournois/${event.slug}/inscription`} size="lg" variant="brand">
        Réserver ma place pour {formatEuros(totals.totalCents)}
      </Button>
    );
  }

  return (
    <div className="page-shell py-10 sm:py-14">
      <Link href="/calendrier" className="inline-flex items-center gap-1 text-sm text-cream-500 transition-colors hover:text-gold-300">
        <IconChevronLeft size={16} /> Calendrier des tournois
      </Link>

      {banner && (
        <Alert tone={banner.tone} className="mt-5">
          {banner.text}
        </Alert>
      )}

      {/* ---------- Le billet ---------- */}
      <Ticket as="section" className="mt-6">
        <TicketBody className="p-7 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="kicker text-poster">{event.format_label ?? "One Piece Card Game"}</p>
            <div className="flex flex-wrap gap-2">
              <PaperPill tone={event.counts_for_league ? "brand" : "neutral"}>{event.counts_for_league ? "Compte pour la ligue" : "Hors ligue"}</PaperPill>
              {event.status === "cancelled" && <PaperPill tone="bad">Tournoi annulé</PaperPill>}
              {event.status === "completed" && <PaperPill tone="good">Terminé</PaperPill>}
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[auto_1fr] lg:gap-12">
            <time dateTime={event.starts_at} className="flex gap-5 lg:block lg:w-40 lg:border-r lg:border-ink/12 lg:pr-8">
              <span className="display-number block text-[4.5rem] text-ink sm:text-[5.5rem]">{dayFormat.format(date)}</span>
              <span className="self-center lg:mt-2 lg:block">
                <span className="block text-base font-semibold text-ink">{monthFormat.format(date)}</span>
                <span className="block text-sm capitalize text-ink-600">{weekdayFormat.format(date)}</span>
              </span>
            </time>

            <div className="min-w-0">
              <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-[-0.025em] text-ink sm:text-5xl">{event.title}</h1>
              {event.subtitle && <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-ink-600">{event.subtitle}</p>}

              <dl className="mt-8 grid gap-6 border-t border-ink/12 pt-6 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-[12px] text-ink-400">Rendez-vous</dt>
                  <dd className="mt-1 font-medium text-ink">
                    Ouverture des portes à {formatTime(event.starts_at)}
                    <span className="mt-1 block font-normal text-ink-600">Arrivez 30 minutes avant pour l&apos;enregistrement Bandai TCG+.</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] text-ink-400">Lieu</dt>
                  <dd className="mt-1 font-medium text-ink">
                    {event.venue_name ?? "Mister 8 TCG"}
                    <span className="mt-1 block whitespace-pre-line font-normal text-ink-600">{event.venue_address ?? event.city}</span>
                    {event.google_maps_url && (
                      <a href={event.google_maps_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[13px] font-semibold text-poster underline underline-offset-4">
                        Ouvrir dans Google Maps
                      </a>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] text-ink-400">Inscription</dt>
                  <dd className="mt-1 font-medium text-ink">
                    {event.price_cents === 0 ? "Gratuit" : formatEuros(event.price_cents)}
                    {totals.feeCents > 0 && <span className="font-normal text-ink-600"> + {formatEuros(totals.feeCents)} de frais</span>}
                    <span className="mt-1 block font-normal text-ink-600">
                      {event.capacity > 0
                        ? left === 0
                          ? `Complet, ${event.capacity} places`
                          : `${left} ${plural(left, "place")} ${plural(left, "restante")} sur ${event.capacity}`
                        : "Places illimitées"}
                      {event.rounds ? `, ${event.rounds} rondes suisses` : ""}
                    </span>
                  </dd>
                </div>
              </dl>
              {event.capacity > 0 && (
                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
                  <div className="h-full rounded-full bg-poster" style={{ width: `${fillPct}%` }} />
                </div>
              )}
            </div>
          </div>
        </TicketBody>

        <TicketStub className="flex flex-wrap items-center justify-between gap-6 px-7 py-6 sm:px-10">
          <div className="min-w-0">
            {event.status === "published" && availability.reason !== "past" ? (
              <Countdown targetIso={event.starts_at} tone="paper" />
            ) : (
              <p className="text-sm text-ink-600">{event.status === "completed" ? "Ce tournoi est terminé." : "Ce tournoi n'est plus ouvert."}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {cta}
            {minePaid && <PaperPill tone="good">Vous êtes inscrit</PaperPill>}
            {minePending && <PaperPill tone="warn">Place réservée, paiement en attente</PaperPill>}
          </div>
        </TicketStub>
      </Ticket>

      {minePending && (
        <p className="mt-4 text-sm text-cream-500">
          Votre place est réservée quelques minutes le temps du paiement. Sans paiement, elle est libérée automatiquement.
        </p>
      )}

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <TextBlock title="Le tournoi" text={event.description} />
        <TextBlock title="Déroulé de la journée" text={event.schedule_text} />
        <TextBlock title="Règles du tournoi" text={event.rules_text} />
        <TextBlock title="Dotation" text={event.prizes_text} />
        <section className="rounded-panel border hairline p-6 sm:p-7 md:col-span-2">
          <h2 className="font-display text-xl font-semibold tracking-tight text-cream-100">Une question ?</h2>
          <p className="mt-3 max-w-[70ch] text-[15px] leading-relaxed text-cream-300">
            Écrivez à{" "}
            <a href={tournamentMailto(event.title)} className="text-link">
              {TOURNAMENT_CONTACT_EMAIL}
            </a>{" "}
            pour tout ce qui concerne ce tournoi : inscription, paiement, billet, check-in. Le{" "}
            <Link href="/reglement" className="text-link">
              règlement de la ligue
            </Link>{" "}
            précise les conditions de remboursement.
          </p>
        </section>
      </div>
    </div>
  );
}
