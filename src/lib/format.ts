const TZ = "Europe/Paris";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TZ,
});

const shortFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TZ,
});

const compactFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TZ,
});

const timeFmt = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** « Dimanche 27 septembre 2026 » */
export function formatDateLong(iso: string) {
  return capitalize(dateFmt.format(new Date(iso)));
}

/** « 27 septembre 2026 » */
export function formatDateShort(iso: string) {
  return shortFmt.format(new Date(iso));
}

/** « 27/09/2026 » */
export function formatDateCompact(iso: string) {
  return compactFmt.format(new Date(iso));
}

/** « 14 h 00 » */
export function formatTime(iso: string) {
  return timeFmt.format(new Date(iso)).replace(":", " h ");
}

/** « 27 sept. 2026, 14:00 » */
export function formatDateTime(iso: string) {
  return dateTimeFmt.format(new Date(iso));
}

export function placementLabel(placement: number) {
  return placement === 1 ? "1er" : `${placement}e`;
}

export function plural(n: number, singular: string, pluralForm?: string) {
  return n > 1 ? (pluralForm ?? `${singular}s`) : singular;
}
