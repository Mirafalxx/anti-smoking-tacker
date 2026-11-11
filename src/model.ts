export type Entry = { id: string; day: string; at: string; createdAt: string };
export type Data = { events: Entry[]; zeros: string[] };
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
export const countDay = (events: Entry[], day: string) =>
  events.filter((e) => e.day === day).length;
export const labelDay = (day: string) =>
  new Date(day + "T12:00:00").toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
