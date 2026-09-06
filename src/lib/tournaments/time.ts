// Conversion entre l'heure de Paris (champs <input type="datetime-local">
// de l'admin) et les instants ISO stockés en base. Module pur.

export const PARIS_TIMEZONE = "Europe/Paris";

function partsToMap(parts: Intl.DateTimeFormatPart[]) {
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type === "literal") continue;
    map[part.type] = part.value;
  }
  return map;
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const p = partsToMap(dtf.formatToParts(date));
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second)
  );
  return asUtc - date.getTime();
}

/** "2026-09-27T14:00" (heure de Paris) → ISO UTC. "" si invalide. */
export function parisLocalInputToIso(dtLocal: string): string {
  const m = String(dtLocal ?? "").trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return "";
  const [year, month, day, hour, minute] = m.slice(1).map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let offset = getTimeZoneOffsetMs(new Date(utcGuess), PARIS_TIMEZONE);
  let utcMs = utcGuess - offset;
  const nextOffset = getTimeZoneOffsetMs(new Date(utcMs), PARIS_TIMEZONE);
  if (nextOffset !== offset) {
    offset = nextOffset;
    utcMs = utcGuess - offset;
  }
  return new Date(utcMs).toISOString();
}

/** ISO → "YYYY-MM-DDTHH:mm" en heure de Paris (valeur d'un input datetime-local). */
export function isoToParisLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const p = partsToMap(dtf.formatToParts(d));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
