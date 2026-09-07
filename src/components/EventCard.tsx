import Link from "next/link";
import type { EventWithSeats } from "@/lib/db/events";
import { formatTime } from "@/lib/format";
import { formatEuros } from "@/lib/money";
import { eventAvailability, seatsLeft } from "@/lib/tournaments/status";
import { currentTimeMs } from "@/lib/clock";
import { Button } from "./ui/Button";
import { Ticket, TicketBody, TicketStub } from "./ui/Ticket";
import { cn } from "@/lib/cn";

export type MyRegistrationState = "paid" | "pending" | null;

const dayFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", timeZone: "Europe/Paris" });
const monthFormat = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "Europe/Paris" });
const weekdayFormat = new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: "Europe/Paris" });

/** Petite pastille sur papier (statut du billet). */
export function PaperPill({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn" | "bad" | "brand"; children: React.ReactNode }) {
  const tones = {
    neutral: "border-ink/15 text-ink-600",
    good: "border-emerald-700/30 bg-emerald-700/10 text-emerald-800",
    warn: "border-amber-700/30 bg-amber-600/10 text-amber-800",
    bad: "border-poster/40 bg-poster/10 text-poster",
    brand: "border-poster/30 text-poster",
  };
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-5", tones[tone])}>{children}</span>;
}

/** Le billet d'un tournoi à venir : corps (date, titre, lieu) et talon (prix, places, action). */
export default function EventCard({
  event,
  mine = null,
  nowMs = currentTimeMs(),
  bg,
}: {
  event: EventWithSeats;
  mine?: MyRegistrationState;
  nowMs?: number;
  /** Couleur derrière le billet, pour les encoches (défaut : charbon). */
  bg?: string;
}) {
  const availability = eventAvailability(event, nowMs);
  const left = seatsLeft(event.capacity, event.seats.active_count);
  const full = left === 0;
  const href = `/tournois/${encodeURIComponent(event.slug)}`;
  const date = new Date(event.starts_at);
  const fillPct = event.capacity > 0 ? Math.min(100, Math.round((event.seats.active_count / event.capacity) * 100)) : 0;

  let cta: string;
  let ctaVariant: "brand" | "paper" = "paper";
  if (mine === "paid") cta = "Voir mon billet";
  else if (mine === "pending") {
    cta = "Finaliser le paiement";
    ctaVariant = "brand";
  } else if (full) cta = "Voir le tournoi";
  else if (availability.open) {
    cta = "Réserver ma place";
    ctaVariant = "brand";
  } else cta = "Voir le tournoi";

  return (
    <Ticket bg={bg} className="h-full">
      <TicketBody>
        <div className="flex items-start justify-between gap-4">
          <p className="kicker text-poster">{event.format_label ?? "One Piece Card Game"}</p>
          <PaperPill tone={event.counts_for_league ? "brand" : "neutral"}>{event.counts_for_league ? "Compte pour la ligue" : "Hors ligue"}</PaperPill>
        </div>

        <div className="mt-6 flex gap-5">
          <time dateTime={event.starts_at} className="w-16 shrink-0 border-r border-ink/12 pr-4 text-center">
            <span className="display-number block text-[2.75rem] text-ink">{dayFormat.format(date)}</span>
            <span className="mt-1.5 block text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-400">{monthFormat.format(date).replace(".", "")}</span>
          </time>
          <div className="min-w-0">
            <h3 className="font-display text-2xl font-semibold leading-tight tracking-[-0.015em] text-ink">
              <Link href={href} className="decoration-poster/60 decoration-2 underline-offset-4 hover:underline">
                {event.title}
              </Link>
            </h3>
            <p className="mt-1.5 text-sm capitalize text-ink-600">{weekdayFormat.format(date)}</p>
            {event.subtitle && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-600">{event.subtitle}</p>}
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-ink/12 pt-5 text-sm">
          <div>
            <dt className="text-[12px] text-ink-400">Ouverture des portes</dt>
            <dd className="mt-0.5 font-medium text-ink">{formatTime(event.starts_at)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-ink-400">Lieu</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {event.venue_name ?? "Mister 8 TCG"}
              <span className="block font-normal text-ink-600">{event.city}</span>
            </dd>
          </div>
        </dl>

        {(mine || full || !availability.open) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {mine === "paid" && <PaperPill tone="good">Vous êtes inscrit</PaperPill>}
            {mine === "pending" && <PaperPill tone="warn">Paiement en attente</PaperPill>}
            {full && <PaperPill tone="bad">Complet</PaperPill>}
            {!availability.open && availability.reason === "not_open_yet" && <PaperPill>Inscriptions bientôt ouvertes</PaperPill>}
            {!availability.open && availability.reason === "closed" && <PaperPill>Inscriptions closes</PaperPill>}
          </div>
        )}
      </TicketBody>

      <TicketStub className="flex items-center justify-between gap-5">
        <div className="min-w-0 flex-1">
          <p className="display-number text-2xl text-ink">{event.price_cents === 0 ? "Gratuit" : formatEuros(event.price_cents)}</p>
          <p className="mt-1 text-xs text-ink-600">
            {event.capacity > 0 ? (full ? `Complet, ${event.capacity} places` : `${left} places restantes sur ${event.capacity}`) : "Places illimitées"}
          </p>
          {event.capacity > 0 && (
            <div className="mt-2 h-1 w-full max-w-40 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
              <div className="h-full rounded-full bg-poster" style={{ width: `${fillPct}%` }} />
            </div>
          )}
        </div>
        <Button href={href} variant={ctaVariant} size="md" className="shrink-0">
          {cta}
        </Button>
      </TicketStub>
    </Ticket>
  );
}
