import Link from "next/link";
import type { EventWithSeats } from "@/lib/db/events";
import { formatDateLong, formatTime } from "@/lib/format";
import { formatEuros } from "@/lib/money";
import { eventAvailability, seatsLeft } from "@/lib/tournaments/status";
import { Badge } from "./ui/Badge";
import { currentTimeMs } from "@/lib/clock";

export type MyRegistrationState = "paid" | "pending" | null;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline">
      <dt className="text-ink-600">{label}</dt>
      <dd className="flex-1 border-b-2 border-dotted border-ink/40 mx-2" aria-hidden="true" />
      <dd className="font-semibold tabular text-right">{value}</dd>
    </div>
  );
}

/** Carte « L'Affiche » d'un tournoi à venir. */
export default function EventCard({
  event,
  mine = null,
  nowMs = currentTimeMs(),
}: {
  event: EventWithSeats;
  mine?: MyRegistrationState;
  nowMs?: number;
}) {
  const availability = eventAvailability(event, nowMs);
  const left = seatsLeft(event.capacity, event.seats.active_count);
  const full = left === 0;
  const href = `/tournois/${encodeURIComponent(event.slug)}`;

  let cta: React.ReactNode;
  if (mine === "paid") cta = "VOUS ÊTES INSCRIT · VOIR MON BILLET";
  else if (mine === "pending") cta = "FINALISER MON PAIEMENT";
  else if (full) cta = "COMPLET · VOIR LE TOURNOI";
  else if (availability.open) cta = `S'INSCRIRE · ${formatEuros(event.price_cents)}`;
  else cta = "VOIR LE TOURNOI";

  return (
    <article className="bg-paper text-ink poster-frame p-6 sm:p-7 flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[10px] tracking-[0.24em] font-extrabold text-poster">ONE PIECE CARD GAME</p>
        {event.format_label && (
          <span className="shrink-0 text-[10px] font-bold tracking-wider px-2 py-1 bg-ink text-gold-400">{event.format_label}</span>
        )}
      </div>
      <h3 className="font-poster text-2xl mt-3 leading-snug">
        <Link href={href} className="hover:underline decoration-poster decoration-2 underline-offset-4">
          {event.title}
        </Link>
      </h3>
      {event.subtitle && <p className="mt-1 text-sm text-ink-600">{event.subtitle}</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {event.counts_for_league ? (
          <span className="text-[11px] font-semibold tracking-wide text-poster">Compte pour la ligue</span>
        ) : (
          <span className="text-[11px] font-semibold tracking-wide text-ink-400">Hors ligue</span>
        )}
        {mine === "paid" && <Badge tone="good">Inscrit</Badge>}
        {mine === "pending" && <Badge tone="warn">Paiement en attente</Badge>}
        {full && <Badge tone="bad">Complet</Badge>}
        {!availability.open && availability.reason === "not_open_yet" && <Badge tone="neutral">Bientôt</Badge>}
        {!availability.open && availability.reason === "closed" && <Badge tone="neutral">Inscriptions closes</Badge>}
      </div>
      <dl className="mt-4 space-y-1.5 text-sm">
        <Row label="Date" value={formatDateLong(event.starts_at)} />
        <Row label="Ouverture" value={formatTime(event.starts_at)} />
        <Row label="Lieu" value={event.venue_name ? `${event.venue_name}, ${event.city}` : event.city} />
        <Row
          label="Places · tarif"
          value={
            event.capacity > 0
              ? `${Math.max(0, event.capacity - event.seats.active_count)} / ${event.capacity} · ${formatEuros(event.price_cents)}`
              : `Illimité · ${formatEuros(event.price_cents)}`
          }
        />
      </dl>
      {event.capacity > 0 && (
        <div className="mt-4 h-1.5 w-full bg-ink/10 overflow-hidden">
          <div
            className="h-full bg-poster"
            style={{ width: `${Math.min(100, Math.round((event.seats.active_count / event.capacity) * 100))}%` }}
          />
        </div>
      )}
      <Link
        href={href}
        className="mt-6 block text-paper-50 text-center font-bold py-3 tracking-wide hover:brightness-110 transition bg-poster"
      >
        {cta}
      </Link>
    </article>
  );
}
