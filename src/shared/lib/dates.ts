export const dayKey = (
  date: Date,
  zone = Intl.DateTimeFormat().resolvedOptions().timeZone,
) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
export function daysBetween(start: string, end: string) {
  const days: string[] = [];
  for (
    let d = new Date(start + "T12:00:00Z");
    d <= new Date(end + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + 1)
  )
    days.push(d.toISOString().slice(0, 10));
  return days;
}
export const labelDay = (day: string) =>
  new Date(day + "T12:00:00").toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/** Convert a datetime-local value in the account timezone to a UTC timestamp. */
export function wallTimeToIso(value: string, zone: string): string | null {
  const wall = new Date(value + "Z");
  if (!Number.isFinite(+wall)) return null;
  let instant = wall;
  for (let i = 0; i < 3; i++) {
    const local = new Intl.DateTimeFormat("sv-SE", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(instant)
      .replace(" ", "T");
    instant = new Date(+instant + (+wall - +new Date(local + "Z")));
  }
  return instant.toISOString();
}
