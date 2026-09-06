// États d'inscription et disponibilité d'un tournoi. Module pur.

export type RegistrationStatus = "pending_payment" | "paid" | "checked_in" | "cancelled" | "refunded";

export function isPaidStatus(s: string): boolean {
  return s === "paid" || s === "checked_in";
}

export function isPendingStatus(s: string): boolean {
  return s === "pending_payment";
}

/** Inscription qui occupe une place : payée, ou réservation encore valide. */
export function isActiveRegistration(
  r: { status: string; expires_at: string | null },
  nowMs: number
): boolean {
  if (isPaidStatus(r.status)) return true;
  if (!isPendingStatus(r.status)) return false;
  if (!r.expires_at) return false;
  return new Date(r.expires_at).getTime() > nowMs;
}

export type EventWindow = {
  status: string;
  starts_at: string;
  registration_open_at: string | null;
  registration_close_at: string | null;
};

export type AvailabilityReason =
  | "draft"
  | "cancelled"
  | "completed"
  | "past"
  | "not_open_yet"
  | "closed"
  | null;

export type Availability = { open: boolean; reason: AvailabilityReason };

export function eventAvailability(e: EventWindow, nowMs: number): Availability {
  if (e.status === "draft") return { open: false, reason: "draft" };
  if (e.status === "cancelled") return { open: false, reason: "cancelled" };
  if (e.status === "completed") return { open: false, reason: "completed" };
  if (new Date(e.starts_at).getTime() <= nowMs) return { open: false, reason: "past" };
  if (e.registration_open_at && new Date(e.registration_open_at).getTime() > nowMs) {
    return { open: false, reason: "not_open_yet" };
  }
  if (e.registration_close_at && new Date(e.registration_close_at).getTime() < nowMs) {
    return { open: false, reason: "closed" };
  }
  return { open: true, reason: null };
}

/** Places restantes ; Infinity si la capacité est illimitée (0). */
export function seatsLeft(capacity: number, activeCount: number): number {
  if (!capacity || capacity <= 0) return Infinity;
  return Math.max(0, capacity - activeCount);
}

export function isEventPast(startsAt: string, nowMs: number): boolean {
  return new Date(startsAt).getTime() <= nowMs;
}

/** Libellés FR des états d'inscription. */
export function registrationStatusLabel(s: string): string {
  switch (s) {
    case "pending_payment":
      return "Paiement en attente";
    case "paid":
      return "Inscrit";
    case "checked_in":
      return "Présent";
    case "cancelled":
      return "Annulée";
    case "refunded":
      return "Remboursée";
    default:
      return s;
  }
}

export function availabilityLabel(reason: AvailabilityReason): string {
  switch (reason) {
    case "draft":
      return "Brouillon";
    case "cancelled":
      return "Annulé";
    case "completed":
      return "Terminé";
    case "past":
      return "Tournoi passé";
    case "not_open_yet":
      return "Inscriptions bientôt ouvertes";
    case "closed":
      return "Inscriptions closes";
    default:
      return "Inscriptions ouvertes";
  }
}
