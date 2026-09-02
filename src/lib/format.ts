const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Paris",
});

const shortFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Paris",
});

const timeFmt = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

export function formatDateLong(iso: string) {
  const s = dateFmt.format(new Date(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDateShort(iso: string) {
  return shortFmt.format(new Date(iso));
}

export function formatTime(iso: string) {
  return timeFmt.format(new Date(iso)).replace(":", " h ");
}

export function placementLabel(placement: number) {
  return placement === 1 ? "1er" : `${placement}e`;
}
